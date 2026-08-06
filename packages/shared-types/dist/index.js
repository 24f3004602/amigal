"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindMatchSchema = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
// ==================== AUTH ====================
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).max(128),
    displayName: zod_1.z.string().min(1).max(50).optional(),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
// ==================== MATCHING ====================
exports.FindMatchSchema = zod_1.z.object({
    mode: zod_1.z.enum(['text', 'video']),
    interests: zod_1.z.array(zod_1.z.string().max(30)).max(20).default([]),
    region: zod_1.z.string().max(10).optional(),
});
