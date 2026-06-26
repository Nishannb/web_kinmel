"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultOverlaySettings } from "@/lib/defaults";
import {
  InstagramAccount,
  LiveEvent,
  OverlaySettings,
  Product,
  SessionUser,
} from "@/lib/appTypes";
import { supabase } from "@/lib/supabase";
import { getSafeSession, isRecoverableAuthError, clearStaleAuthSession } from "@/lib/supabaseAuth";
import { uploadProductImageToR2 } from "@/lib/uploadProductImageR2";

type CreateEventInput = {
  instagramAccountId: string;
  initialProductIds?: string[];
};

type CreateProductInput = {
  name: string;
  price: number;
  buyCode: string;
  stockQuantity: number;
  /** Required; uploaded to R2 before insert. */
  imageFile: File;
  productUrl?: string;
};

type AppContextValue = {
  user: SessionUser | null;
  events: LiveEvent[];
  catalogProducts: Product[];
  instagramAccounts: InstagramAccount[];
  businessId: string | null;
  isReady: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createEvent: (input: CreateEventInput) => Promise<string>;
  deleteEvent: (eventId: string) => Promise<void>;
  getEventById: (eventId: string) => LiveEvent | undefined;
  createCatalogProduct: (input: CreateProductInput) => Promise<string>;
  deleteCatalogProduct: (productId: string) => Promise<void>;
  updateCatalogProductStock: (productId: string, stockQuantity: number) => Promise<void>;
  addProductToEvent: (
    eventId: string,
    input: CreateProductInput & { buyCode: string }
  ) => Promise<string>;
  addExistingProductToEvent: (
    eventId: string,
    productId: string,
    buyCode?: string
  ) => Promise<void>;
  ensureProductOnEvent: (eventId: string, productId: string) => Promise<void>;
  updateEventProductDiscountPercent: (
    eventId: string,
    productId: string,
    discountPercent: number
  ) => Promise<void>;
  updateEventProductBuyCode: (
    eventId: string,
    productId: string,
    buyCode: string
  ) => Promise<void>;
  updateOverlaySettings: (eventId: string, settings: OverlaySettings) => void;
  refreshData: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

const overlayByEvent = new Map<string, OverlaySettings>();

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const buildDefaultProductUrl = useCallback(
    (productId: string) => {
      if (typeof window === "undefined") return null;
      return `${window.location.origin}/buy/${encodeURIComponent(productId)}`;
    },
    []
  );

  const loadBusinessData = useCallback(async (authUserId: string) => {
    const businessLookup = await supabase
      .from("business_users")
      .select("business_id")
      .eq("auth_user_id", authUserId)
      .limit(1)
      .maybeSingle();
    if (businessLookup.error) {
      throw businessLookup.error;
    }
    const nextBusinessId =
      (businessLookup.data as { business_id?: string } | null)?.business_id ?? null;
    setBusinessId(nextBusinessId);
    if (!nextBusinessId) {
      setInstagramAccounts([]);
      setEvents([]);
      setCatalogProducts([]);
      return;
    }

    const [accountsRes, sessionsRes, productsRes] = await Promise.all([
      supabase
        .from("instagram_accounts")
        .select("id,username,instagram_user_id")
        .eq("business_id", nextBusinessId)
        .eq("is_active", true)
        .order("created_at", { ascending: true }),
      supabase
        .from("live_sessions")
        .select("id,business_id,instagram_account_id,title,status,started_at,created_at")
        .eq("business_id", nextBusinessId)
        .order("created_at", { ascending: false }),
      supabase
        .from("products")
        .select("id,name,price,currency,image_url,product_url,sku,updated_at,stock_quantity")
        .eq("business_id", nextBusinessId)
        .eq("is_active", true)
        .order("updated_at", { ascending: false }),
    ]);
    if (accountsRes.error) throw accountsRes.error;
    if (sessionsRes.error) throw sessionsRes.error;
    if (productsRes.error) throw productsRes.error;

    const nextAccounts: InstagramAccount[] = (accountsRes.data ?? []).map((row) => ({
      id: String(row.id),
      username: row.username ?? null,
      instagramUserId: String(row.instagram_user_id),
    }));
    setInstagramAccounts(nextAccounts);
    const nextCatalogProducts: Product[] = (productsRes.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      price: Number(row.price ?? 0),
      currency: String(row.currency ?? "NPR"),
      imageUrl: row.image_url ?? undefined,
      productUrl: row.product_url ?? undefined,
      buyCode: row.sku ? String(row.sku) : undefined,
      stockQuantity:
        row.stock_quantity == null ? null : Number(row.stock_quantity ?? 0),
      catalogUpdatedAt: row.updated_at ? String(row.updated_at) : undefined,
    }));
    setCatalogProducts(nextCatalogProducts);

    const sessions = sessionsRes.data ?? [];
    if (sessions.length === 0) {
      setEvents([]);
      return;
    }
    const sessionIds = sessions.map((s) => String(s.id));
    const lineupRes = await supabase
      .from("live_session_products")
      .select(
        "live_session_id,promo_price,live_call_number,created_at,products(id,name,price,currency,image_url,product_url,sku)"
      )
      .in("live_session_id", sessionIds)
      .order("created_at", { ascending: false });
    if (lineupRes.error) throw lineupRes.error;

    const productsByEvent = new Map<string, Product[]>();
    for (const row of lineupRes.data ?? []) {
      const productRaw = row.products;
      const productObj =
        Array.isArray(productRaw) && productRaw.length > 0
          ? productRaw[0]
          : !Array.isArray(productRaw)
            ? productRaw
            : null;
      if (!productObj) continue;
      const eventId = String(row.live_session_id);
      const current = productsByEvent.get(eventId) ?? [];
      current.push({
        id: String(productObj.id),
        name: String(productObj.name),
        price: Number(productObj.price ?? 0),
        currency: String(productObj.currency ?? "NPR"),
        imageUrl: productObj.image_url ?? undefined,
        productUrl: productObj.product_url ?? undefined,
        discountedPrice:
          row.promo_price == null ? null : Number(row.promo_price ?? 0),
        buyCode: String(row.live_call_number ?? productObj.sku ?? ""),
        sessionAddedAt: row.created_at ? String(row.created_at) : undefined,
      });
      productsByEvent.set(eventId, current);
    }

    const nextEvents: LiveEvent[] = sessions.map((row) => ({
      id: String(row.id),
      businessId: String(row.business_id),
      instagramAccountId: String(row.instagram_account_id),
      name: (row.title as string | null) ?? "Untitled Event",
      status: (row.status as LiveEvent["status"]) ?? "scheduled",
      startedAt: (row.started_at as string | null) ?? null,
      createdAt: String(row.created_at),
      products: productsByEvent.get(String(row.id)) ?? [],
      overlaySettings: overlayByEvent.get(String(row.id)) ?? defaultOverlaySettings(),
    }));
    setEvents(nextEvents);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const session = await getSafeSession();
      const authUser = session?.user ?? null;
      if (!authUser) {
        setUser(null);
        setBusinessId(null);
        setInstagramAccounts([]);
        setEvents([]);
        setCatalogProducts([]);
        return;
      }
      setUser({
        id: authUser.id,
        email: authUser.email ?? "unknown@example.com",
      });
      await loadBusinessData(authUser.id);
    } catch (err) {
      if (isRecoverableAuthError(err as { message?: string; code?: string })) {
        await clearStaleAuthSession();
        setUser(null);
        setBusinessId(null);
        setInstagramAccounts([]);
        setEvents([]);
        setCatalogProducts([]);
        return;
      }
      throw err;
    }
  }, [loadBusinessData]);

  useEffect(() => {
    const init = async () => {
      try {
        await refreshData();
        setError(null);
      } catch (err) {
        if (isRecoverableAuthError(err as { message?: string; code?: string })) {
          await clearStaleAuthSession();
          setUser(null);
          setBusinessId(null);
          setInstagramAccounts([]);
          setEvents([]);
          setCatalogProducts([]);
          setError(null);
        } else {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
        }
      } finally {
        setIsReady(true);
      }
    };
    void init();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      queueMicrotask(() => {
        if (!session?.user) {
          setUser(null);
          setBusinessId(null);
          setInstagramAccounts([]);
          setEvents([]);
          setCatalogProducts([]);
          return;
        }
        setUser({
          id: session.user.id,
          email: session.user.email ?? "unknown@example.com",
        });
        void loadBusinessData(session.user.id);
      });
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, [loadBusinessData, refreshData]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!isReady) return;
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        throw result.error;
      }
      await refreshData();
    },
    [isReady, refreshData]
  );

  const register = useCallback(
    async (email: string, password: string) => {
      if (!isReady) return;
      const result = await supabase.auth.signUp({ email, password });
      if (result.error) {
        throw result.error;
      }
      await refreshData();
    },
    [isReady, refreshData]
  );

  const logout = useCallback(async () => {
    if (!isReady) return;
    const result = await supabase.auth.signOut();
    if (result.error) {
      throw result.error;
    }
    setUser(null);
    setBusinessId(null);
    setInstagramAccounts([]);
    setEvents([]);
    setCatalogProducts([]);
  }, [isReady]);

  const createEvent = useCallback(
    async (input: CreateEventInput) => {
      if (!isReady) return "";
      if (!businessId) {
        throw new Error("No business found for this user.");
      }
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const title = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate()
      )} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      const result = await supabase
        .from("live_sessions")
        .insert({
          business_id: businessId,
          instagram_account_id: input.instagramAccountId,
          title,
          status: "scheduled",
        })
        .select("id")
        .single();
      if (result.error) {
        throw result.error;
      }
      const eventId = String(result.data.id);
      const selectedProductIds = Array.from(new Set(input.initialProductIds ?? []));
      if (selectedProductIds.length > 0) {
        const lineupRows = selectedProductIds.map((productId, index) => ({
          live_session_id: eventId,
          product_id: productId,
          display_order: index,
          live_call_number: `item${index + 1}`,
        }));
        const lineupRes = await supabase.from("live_session_products").insert(lineupRows);
        if (lineupRes.error) {
          throw lineupRes.error;
        }
      }
      await refreshData();
      return eventId;
    },
    [businessId, isReady, refreshData]
  );

  const getEventById = useCallback(
    (eventId: string) => events.find((event) => event.id === eventId),
    [events]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      if (!isReady) return;
      const result = await supabase.from("live_sessions").delete().eq("id", eventId);
      if (result.error) {
        throw result.error;
      }
      overlayByEvent.delete(eventId);
      await refreshData();
    },
    [isReady, refreshData]
  );

  const addProductToEvent = useCallback(
    async (eventId: string, input: CreateProductInput & { buyCode: string }) => {
      if (!isReady) return "";
      if (!businessId) {
        throw new Error("No business found for this user.");
      }

      const targetEvent = events.find((event) => event.id === eventId);
      if (!targetEvent) {
        throw new Error("Event not found.");
      }
      const nextDisplayOrder = targetEvent.products.length;
      const callNumber = input.buyCode.trim();
      if (!callNumber) {
        throw new Error("Buy code is required.");
      }
      if (!input.imageFile || input.imageFile.size === 0) {
        throw new Error("A product image is required.");
      }
      if (!Number.isFinite(input.stockQuantity) || input.stockQuantity < 0) {
        throw new Error("Available quantity must be 0 or more.");
      }
      const imageUrl = await uploadProductImageToR2(
        supabase,
        businessId,
        input.imageFile
      );
      const productRes = await supabase
        .from("products")
        .insert({
          business_id: businessId,
          name: input.name,
          price: input.price,
          currency: "NPR",
          image_url: imageUrl,
          product_url: null,
          sku: callNumber,
          stock_quantity: Math.floor(input.stockQuantity),
        })
        .select("id")
        .single();
      if (productRes.error) {
        if (productRes.error.code === "23505") {
          throw new Error("That buy code is already used by another product.");
        }
        throw productRes.error;
      }
      const productId = String(productRes.data.id);
      const uniqueUrl = buildDefaultProductUrl(productId);
      if (uniqueUrl) {
        const updateRes = await supabase
          .from("products")
          .update({ product_url: uniqueUrl })
          .eq("id", productId);
        if (updateRes.error) {
          throw updateRes.error;
        }
      }

      const lineupRes = await supabase.from("live_session_products").insert({
        live_session_id: eventId,
        product_id: productId,
        display_order: nextDisplayOrder,
        live_call_number: callNumber,
      });
      if (lineupRes.error) {
        throw lineupRes.error;
      }

      await refreshData();
      return productId;
    },
    [buildDefaultProductUrl, businessId, events, isReady, refreshData]
  );

  const createCatalogProduct = useCallback(
    async (input: CreateProductInput) => {
      if (!isReady) return "";
      if (!businessId) {
        throw new Error("No business found for this user.");
      }
      const buyCode = input.buyCode.trim();
      if (!buyCode) {
        throw new Error("Buy code is required.");
      }
      if (/\s/.test(buyCode)) {
        throw new Error("Buy code must be a single word with no spaces.");
      }
      if (!input.imageFile || input.imageFile.size === 0) {
        throw new Error("A product image is required.");
      }
      if (!Number.isFinite(input.stockQuantity) || input.stockQuantity < 0) {
        throw new Error("Available quantity must be 0 or more.");
      }
      const imageUrl = await uploadProductImageToR2(
        supabase,
        businessId,
        input.imageFile
      );
      const productRes = await supabase
        .from("products")
        .insert({
          business_id: businessId,
          name: input.name,
          price: input.price,
          currency: "NPR",
          image_url: imageUrl,
          product_url: null,
          sku: buyCode,
          stock_quantity: Math.floor(input.stockQuantity),
        })
        .select("id")
        .single();
      if (productRes.error) {
        if (productRes.error.code === "23505") {
          throw new Error("That buy code is already used by another product.");
        }
        throw productRes.error;
      }
      const productId = String(productRes.data.id);
      const uniqueUrl = buildDefaultProductUrl(productId);
      if (uniqueUrl) {
        const updateRes = await supabase
          .from("products")
          .update({ product_url: uniqueUrl })
          .eq("id", productId);
        if (updateRes.error) {
          throw updateRes.error;
        }
      }
      await refreshData();
      return productId;
    },
    [buildDefaultProductUrl, businessId, isReady, refreshData]
  );

  const updateCatalogProductStock = useCallback(
    async (productId: string, stockQuantity: number) => {
      if (!isReady) return;
      if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
        throw new Error("Available quantity must be 0 or more.");
      }
      const { error } = await supabase
        .from("products")
        .update({ stock_quantity: Math.floor(stockQuantity) })
        .eq("id", productId);
      if (error) {
        throw error;
      }
      await refreshData();
    },
    [isReady, refreshData]
  );

  const deleteCatalogProduct = useCallback(
    async (productId: string) => {
      if (!isReady) return;
      const lineupDelete = await supabase
        .from("live_session_products")
        .delete()
        .eq("product_id", productId);
      if (lineupDelete.error) throw lineupDelete.error;
      const productDelete = await supabase.from("products").delete().eq("id", productId);
      if (productDelete.error) throw productDelete.error;
      await refreshData();
    },
    [isReady, refreshData]
  );

  const ensureProductOnEvent = useCallback(
    async (eventId: string, productId: string) => {
      if (!isReady) return;
      const targetEvent = events.find((event) => event.id === eventId);
      if (!targetEvent) {
        throw new Error("Event not found.");
      }
      if (targetEvent.products.some((product) => product.id === productId)) {
        return;
      }
      const catalogProduct = catalogProducts.find((product) => product.id === productId);
      if (!catalogProduct) {
        throw new Error("Product not found in catalog.");
      }
      const callNumber = catalogProduct.buyCode?.trim() ?? "";
      if (!callNumber) {
        throw new Error("This product needs a buy code in your catalog first.");
      }
      const lineupRes = await supabase.from("live_session_products").insert({
        live_session_id: eventId,
        product_id: productId,
        display_order: targetEvent.products.length,
        live_call_number: callNumber,
      });
      if (lineupRes.error) {
        throw lineupRes.error;
      }
      await refreshData();
    },
    [catalogProducts, events, isReady, refreshData]
  );

  const addExistingProductToEvent = useCallback(
    async (eventId: string, productId: string, buyCode?: string) => {
      if (!isReady) return;
      const targetEvent = events.find((event) => event.id === eventId);
      if (!targetEvent) {
        throw new Error("Event not found.");
      }
      if (targetEvent.products.some((product) => product.id === productId)) {
        throw new Error("Product is already in this event.");
      }
      const catalogProduct = catalogProducts.find((product) => product.id === productId);
      const callNumber = (buyCode?.trim() || catalogProduct?.buyCode?.trim() || "");
      if (!callNumber) {
        throw new Error("Buy code is required.");
      }
      const lineupRes = await supabase.from("live_session_products").insert({
        live_session_id: eventId,
        product_id: productId,
        display_order: targetEvent.products.length,
        live_call_number: callNumber,
      });
      if (lineupRes.error) {
        throw lineupRes.error;
      }
      await refreshData();
    },
    [catalogProducts, events, isReady, refreshData]
  );

  const updateEventProductDiscountPercent = useCallback(
    async (eventId: string, productId: string, discountPercent: number) => {
      if (!isReady) return;
      const catalogProduct = catalogProducts.find((product) => product.id === productId);
      if (!catalogProduct) {
        throw new Error("Product not found in catalog.");
      }
      await ensureProductOnEvent(eventId, productId);
      const clamped = Math.max(0, Math.min(99, discountPercent));
      const promoPrice =
        clamped <= 0
          ? null
          : Number((catalogProduct.price * (1 - clamped / 100)).toFixed(2));
      const { error } = await supabase
        .from("live_session_products")
        .update({ promo_price: promoPrice })
        .eq("live_session_id", eventId)
        .eq("product_id", productId);
      if (error) {
        throw error;
      }
      await refreshData();
    },
    [catalogProducts, ensureProductOnEvent, isReady, refreshData]
  );

  const updateEventProductBuyCode = useCallback(
    async (eventId: string, productId: string, buyCode: string) => {
      if (!isReady) return;
      const normalized = buyCode.trim();
      if (!normalized) {
        throw new Error("Buy code is required.");
      }
      const targetEvent = events.find((event) => event.id === eventId);
      if (!targetEvent) {
        throw new Error("Event not found.");
      }
      if (!targetEvent.products.some((product) => product.id === productId)) {
        const insertRes = await supabase.from("live_session_products").insert({
          live_session_id: eventId,
          product_id: productId,
          display_order: targetEvent.products.length,
          live_call_number: normalized,
        });
        if (insertRes.error) {
          throw insertRes.error;
        }
        await refreshData();
        return;
      }
      const { error } = await supabase
        .from("live_session_products")
        .update({ live_call_number: normalized })
        .eq("live_session_id", eventId)
        .eq("product_id", productId);
      if (error) {
        throw error;
      }
      await supabase.from("products").update({ sku: normalized }).eq("id", productId);
      await refreshData();
    },
    [events, isReady, refreshData]
  );

  const updateOverlaySettings = useCallback(
    (eventId: string, settings: OverlaySettings) => {
      overlayByEvent.set(eventId, settings);
      setEvents((prev) =>
        prev.map((event) =>
          event.id !== eventId
            ? event
            : {
                ...event,
                overlaySettings: settings,
              }
        )
      );
    },
    []
  );

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      events,
      catalogProducts,
      instagramAccounts,
      businessId,
      isReady,
      error,
      login,
      register,
      logout,
      createEvent,
      deleteEvent,
      getEventById,
      createCatalogProduct,
      deleteCatalogProduct,
      updateCatalogProductStock,
      addProductToEvent,
      addExistingProductToEvent,
      ensureProductOnEvent,
      updateEventProductDiscountPercent,
      updateEventProductBuyCode,
      updateOverlaySettings,
      refreshData,
    }),
    [
      addProductToEvent,
      businessId,
      createEvent,
      deleteEvent,
      error,
      events,
      catalogProducts,
      getEventById,
      createCatalogProduct,
      deleteCatalogProduct,
      updateCatalogProductStock,
      addExistingProductToEvent,
      ensureProductOnEvent,
      updateEventProductDiscountPercent,
      updateEventProductBuyCode,
      instagramAccounts,
      isReady,
      login,
      logout,
      register,
      refreshData,
      updateOverlaySettings,
      user,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used within AppProvider");
  }
  return context;
}
