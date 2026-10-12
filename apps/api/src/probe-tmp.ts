import { Hono } from "hono";
import { hc } from "hono/client";
import type { AppType } from "./index.js";

const mini = new Hono().get("/ping", (c) => c.json({ ok: true }));
type Mini = typeof mini;
type RoutesOf<T extends Hono<any, any, any>> = T extends Hono<any, infer S, any> ? S : never;
type AppRoutes = RoutesOf<AppType>;
type R1 = AppRoutes["/api/health"];
type AppKeys = keyof AppRoutes;

const k1: AppKeys = "/api/health";
void k1;
export const p1 = hc<Mini>("/").index.$get;
export const p2 = hc<AppType, "/api/health">("/");
