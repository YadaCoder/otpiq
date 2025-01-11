"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomCode = generateRandomCode;
function generateRandomCode(length = 6) {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}
