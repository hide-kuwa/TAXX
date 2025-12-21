(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/DrumControl.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/components/DrumControl.tsx
__turbopack_context__.s([
    "default",
    ()=>DrumControl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
// 年データのダミー
const years = Array.from({
    length: 10
}, (_, i)=>({
        id: 2025 - i,
        label: `${2025 - i}年`
    }));
// 月データのダミー
const months = Array.from({
    length: 12
}, (_, i)=>({
        id: i + 1,
        label: `${i + 1}月`
    }));
function DrumControl() {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(18);
    if ($[0] !== "73b0b1acf3e47f6eb6d4c0464a4a7f6becafbf0c416558bcf8d68806c128f3bf") {
        for(let $i = 0; $i < 18; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "73b0b1acf3e47f6eb6d4c0464a4a7f6becafbf0c416558bcf8d68806c128f3bf";
    }
    const [activeYear, setActiveYear] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(2025);
    const [activeMonth, setActiveMonth] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(3);
    let t0;
    let t1;
    let t2;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-x-0 top-0 h-32 mask-v-top z-10 pointer-events-none"
        }, void 0, false, {
            fileName: "[project]/src/components/DrumControl.tsx",
            lineNumber: 41,
            columnNumber: 10
        }, this);
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-x-0 bottom-0 h-32 mask-v-bottom z-10 pointer-events-none"
        }, void 0, false, {
            fileName: "[project]/src/components/DrumControl.tsx",
            lineNumber: 42,
            columnNumber: 10
        }, this);
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-1/2 left-2 right-2 h-12 -mt-6 border-y border-blue-500/50 rounded-lg bg-blue-500/10 pointer-events-none z-0"
        }, void 0, false, {
            fileName: "[project]/src/components/DrumControl.tsx",
            lineNumber: 43,
            columnNumber: 10
        }, this);
        $[1] = t0;
        $[2] = t1;
        $[3] = t2;
    } else {
        t0 = $[1];
        t1 = $[2];
        t2 = $[3];
    }
    let t3;
    if ($[4] !== activeYear) {
        t3 = years.map({
            "DrumControl[years.map()]": (y)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    onClick: {
                        "DrumControl[years.map() > <div>.onClick]": ()=>setActiveYear(Number(y.id))
                    }["DrumControl[years.map() > <div>.onClick]"],
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])("v-item h-12 flex items-center justify-center font-bold text-lg transition-all duration-300", activeYear === y.id ? "active text-blue-400 scale-110" : "text-slate-500"),
                    children: y.label
                }, y.id, false, {
                    fileName: "[project]/src/components/DrumControl.tsx",
                    lineNumber: 55,
                    columnNumber: 40
                }, this)
        }["DrumControl[years.map()]"]);
        $[4] = activeYear;
        $[5] = t3;
    } else {
        t3 = $[5];
    }
    let t4;
    if ($[6] !== t3) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex-1 border-r border-slate-700 relative group",
            children: [
                t0,
                t1,
                t2,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-full v-drum-scroller no-scrollbar py-[40vh]",
                    children: t3
                }, void 0, false, {
                    fileName: "[project]/src/components/DrumControl.tsx",
                    lineNumber: 66,
                    columnNumber: 87
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/DrumControl.tsx",
            lineNumber: 66,
            columnNumber: 10
        }, this);
        $[6] = t3;
        $[7] = t4;
    } else {
        t4 = $[7];
    }
    let t5;
    let t6;
    let t7;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-x-0 top-0 h-32 mask-v-top z-10 pointer-events-none"
        }, void 0, false, {
            fileName: "[project]/src/components/DrumControl.tsx",
            lineNumber: 76,
            columnNumber: 10
        }, this);
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-x-0 bottom-0 h-32 mask-v-bottom z-10 pointer-events-none"
        }, void 0, false, {
            fileName: "[project]/src/components/DrumControl.tsx",
            lineNumber: 77,
            columnNumber: 10
        }, this);
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-1/2 left-2 right-2 h-12 -mt-6 border-y border-slate-500/30 rounded-lg pointer-events-none z-0"
        }, void 0, false, {
            fileName: "[project]/src/components/DrumControl.tsx",
            lineNumber: 78,
            columnNumber: 10
        }, this);
        $[8] = t5;
        $[9] = t6;
        $[10] = t7;
    } else {
        t5 = $[8];
        t6 = $[9];
        t7 = $[10];
    }
    let t8;
    if ($[11] !== activeMonth) {
        t8 = months.map({
            "DrumControl[months.map()]": (m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    onClick: {
                        "DrumControl[months.map() > <div>.onClick]": ()=>setActiveMonth(Number(m.id))
                    }["DrumControl[months.map() > <div>.onClick]"],
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])("v-item h-12 flex items-center justify-center font-mono text-xl transition-all duration-300", activeMonth === m.id ? "active text-white scale-125" : "text-slate-600"),
                    children: m.label
                }, m.id, false, {
                    fileName: "[project]/src/components/DrumControl.tsx",
                    lineNumber: 90,
                    columnNumber: 41
                }, this)
        }["DrumControl[months.map()]"]);
        $[11] = activeMonth;
        $[12] = t8;
    } else {
        t8 = $[12];
    }
    let t9;
    if ($[13] !== t8) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex-1 relative",
            children: [
                t5,
                t6,
                t7,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-full v-drum-scroller no-scrollbar py-[40vh]",
                    children: t8
                }, void 0, false, {
                    fileName: "[project]/src/components/DrumControl.tsx",
                    lineNumber: 101,
                    columnNumber: 55
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/DrumControl.tsx",
            lineNumber: 101,
            columnNumber: 10
        }, this);
        $[13] = t8;
        $[14] = t9;
    } else {
        t9 = $[14];
    }
    let t10;
    if ($[15] !== t4 || $[16] !== t9) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex h-full bg-slate-900 text-white w-48 shadow-2xl z-20 relative",
            children: [
                t4,
                t9
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/DrumControl.tsx",
            lineNumber: 109,
            columnNumber: 11
        }, this);
        $[15] = t4;
        $[16] = t9;
        $[17] = t10;
    } else {
        t10 = $[17];
    }
    return t10;
}
_s(DrumControl, "nLxG20kDepPYlgYwZ4Xqdi2720U=");
_c = DrumControl;
var _c;
__turbopack_context__.k.register(_c, "DrumControl");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/DocTypeSelector.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/components/DocTypeSelector.tsx
__turbopack_context__.s([
    "default",
    ()=>DocTypeSelector
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module 'lucide-react'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const docTypes = [
    {
        id: "invoice",
        label: "請求書・領収書",
        icon: Receipt
    },
    {
        id: "bank",
        label: "預金通帳",
        icon: Landmark
    },
    {
        id: "pl",
        label: "試算表(TB)",
        icon: Scale
    },
    {
        id: "gl",
        label: "総勘定元帳",
        icon: BookOpen
    },
    {
        id: "tax",
        label: "申告書・決算書",
        icon: FileText
    }
];
function DocTypeSelector() {
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(7);
    if ($[0] !== "a564adf4a815a5c8e7bcb7b88069178633ef25b0b2c6b6aecd158ad3d3b7f679") {
        for(let $i = 0; $i < 7; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "a564adf4a815a5c8e7bcb7b88069178633ef25b0b2c6b6aecd158ad3d3b7f679";
    }
    const [activeType, setActiveType] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("gl");
    let t0;
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-y-0 left-0 w-32 mask-h-left z-10 pointer-events-none"
        }, void 0, false, {
            fileName: "[project]/src/components/DocTypeSelector.tsx",
            lineNumber: 41,
            columnNumber: 10
        }, this);
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-y-0 right-0 w-32 mask-h-right z-10 pointer-events-none"
        }, void 0, false, {
            fileName: "[project]/src/components/DocTypeSelector.tsx",
            lineNumber: 42,
            columnNumber: 10
        }, this);
        $[1] = t0;
        $[2] = t1;
    } else {
        t0 = $[1];
        t1 = $[2];
    }
    let t2;
    if ($[3] !== activeType) {
        t2 = docTypes.map({
            "DocTypeSelector[docTypes.map()]": (doc)=>{
                const Icon = doc.icon;
                const isActive = activeType === doc.id;
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    onClick: {
                        "DocTypeSelector[docTypes.map() > <div>.onClick]": ()=>setActiveType(doc.id)
                    }["DocTypeSelector[docTypes.map() > <div>.onClick]"],
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])("h-item group flex flex-col items-center justify-center gap-2 transition-all duration-300", isActive ? "active text-blue-400" : "text-slate-500"),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])("p-3 rounded-full transition-all duration-300", isActive ? "bg-blue-500/20 ring-2 ring-blue-500" : "bg-slate-800"),
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                size: 24
                            }, void 0, false, {
                                fileName: "[project]/src/components/DocTypeSelector.tsx",
                                lineNumber: 57,
                                columnNumber: 363
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/DocTypeSelector.tsx",
                            lineNumber: 57,
                            columnNumber: 226
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-sm font-bold tracking-wider",
                            children: doc.label
                        }, void 0, false, {
                            fileName: "[project]/src/components/DocTypeSelector.tsx",
                            lineNumber: 57,
                            columnNumber: 387
                        }, this),
                        isActive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute bottom-0 h-1 w-16 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] rounded-t-full"
                        }, void 0, false, {
                            fileName: "[project]/src/components/DocTypeSelector.tsx",
                            lineNumber: 57,
                            columnNumber: 469
                        }, this)
                    ]
                }, doc.id, true, {
                    fileName: "[project]/src/components/DocTypeSelector.tsx",
                    lineNumber: 55,
                    columnNumber: 16
                }, this);
            }
        }["DocTypeSelector[docTypes.map()]"]);
        $[3] = activeType;
        $[4] = t2;
    } else {
        t2 = $[4];
    }
    let t3;
    if ($[5] !== t2) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-24 bg-slate-900 border-b border-slate-700 relative flex items-center shadow-lg z-10",
            children: [
                t0,
                t1,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-drum-scroller no-scrollbar w-full px-[50vw]",
                    children: t2
                }, void 0, false, {
                    fileName: "[project]/src/components/DocTypeSelector.tsx",
                    lineNumber: 67,
                    columnNumber: 121
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/DocTypeSelector.tsx",
            lineNumber: 67,
            columnNumber: 10
        }, this);
        $[5] = t2;
        $[6] = t3;
    } else {
        t3 = $[6];
    }
    return t3;
}
_s(DocTypeSelector, "h084Bo6EuZDEFXEbKHRLfBYakgI=");
_c = DocTypeSelector;
var _c;
__turbopack_context__.k.register(_c, "DocTypeSelector");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/VirtualJournalGrid.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// src/components/VirtualJournalGrid.tsx
__turbopack_context__.s([
    "default",
    ()=>VirtualJournalGrid
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$window$2f$dist$2f$react$2d$window$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-window/dist/react-window.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
"use client";
;
;
;
;
// ダミーデータ（1万件）
const rows = Array.from({
    length: 10000
}, (_, i)=>({
        id: i + 1,
        date: `2025-03-${String(i % 30 + 1).padStart(2, "0")}`,
        debit: "通信費",
        credit: "現金",
        amount: (Math.random() * 10000).toFixed(0),
        summary: `NTTドコモ 3月分利用料 No.${i}`
    }));
// 1行分のコンポーネント
const Row = (t0)=>{
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(26);
    if ($[0] !== "9fd09d9725e442321a6a72f6d5f33b5ea9ef642f4cb19cc08b80912fd17b7927") {
        for(let $i = 0; $i < 26; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "9fd09d9725e442321a6a72f6d5f33b5ea9ef642f4cb19cc08b80912fd17b7927";
    }
    const { index, style } = t0;
    const row = rows[index];
    const t1 = index % 2 === 0 ? "bg-white" : "bg-slate-50";
    let t2;
    if ($[1] !== t1) {
        t2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])("flex items-center border-b border-slate-200 px-4 hover:bg-blue-50 cursor-pointer transition-colors text-sm", t1);
        $[1] = t1;
        $[2] = t2;
    } else {
        t2 = $[2];
    }
    let t3;
    if ($[3] !== row.id) {
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-12 text-slate-400",
            children: row.id
        }, void 0, false, {
            fileName: "[project]/src/components/VirtualJournalGrid.tsx",
            lineNumber: 45,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[3] = row.id;
        $[4] = t3;
    } else {
        t3 = $[4];
    }
    let t4;
    if ($[5] !== row.date) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-24 font-mono text-slate-600",
            children: row.date
        }, void 0, false, {
            fileName: "[project]/src/components/VirtualJournalGrid.tsx",
            lineNumber: 53,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[5] = row.date;
        $[6] = t4;
    } else {
        t4 = $[6];
    }
    let t5;
    if ($[7] !== row.debit) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-24 font-bold text-blue-600",
            children: row.debit
        }, void 0, false, {
            fileName: "[project]/src/components/VirtualJournalGrid.tsx",
            lineNumber: 61,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[7] = row.debit;
        $[8] = t5;
    } else {
        t5 = $[8];
    }
    let t6;
    if ($[9] !== row.credit) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-24 text-slate-600",
            children: row.credit
        }, void 0, false, {
            fileName: "[project]/src/components/VirtualJournalGrid.tsx",
            lineNumber: 69,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[9] = row.credit;
        $[10] = t6;
    } else {
        t6 = $[10];
    }
    const t7 = Number(row.amount);
    let t8;
    if ($[11] !== t7) {
        t8 = t7.toLocaleString();
        $[11] = t7;
        $[12] = t8;
    } else {
        t8 = $[12];
    }
    let t9;
    if ($[13] !== t8) {
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-20 text-right font-mono font-bold text-slate-800",
            children: [
                "¥",
                t8
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/VirtualJournalGrid.tsx",
            lineNumber: 86,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[13] = t8;
        $[14] = t9;
    } else {
        t9 = $[14];
    }
    let t10;
    if ($[15] !== row.summary) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex-1 ml-4 text-slate-500 truncate",
            children: row.summary
        }, void 0, false, {
            fileName: "[project]/src/components/VirtualJournalGrid.tsx",
            lineNumber: 94,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[15] = row.summary;
        $[16] = t10;
    } else {
        t10 = $[16];
    }
    let t11;
    if ($[17] !== style || $[18] !== t10 || $[19] !== t2 || $[20] !== t3 || $[21] !== t4 || $[22] !== t5 || $[23] !== t6 || $[24] !== t9) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: style,
            className: t2,
            children: [
                t3,
                t4,
                t5,
                t6,
                t9,
                t10
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/VirtualJournalGrid.tsx",
            lineNumber: 102,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[17] = style;
        $[18] = t10;
        $[19] = t2;
        $[20] = t3;
        $[21] = t4;
        $[22] = t5;
        $[23] = t6;
        $[24] = t9;
        $[25] = t11;
    } else {
        t11 = $[25];
    }
    return t11;
};
_c = Row;
function VirtualJournalGrid() {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(3);
    if ($[0] !== "9fd09d9725e442321a6a72f6d5f33b5ea9ef642f4cb19cc08b80912fd17b7927") {
        for(let $i = 0; $i < 3; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "9fd09d9725e442321a6a72f6d5f33b5ea9ef642f4cb19cc08b80912fd17b7927";
    }
    let t0;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center bg-slate-100 border-b border-slate-300 px-4 h-8 text-xs font-bold text-slate-500 uppercase tracking-wider flex-shrink-0",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-12",
                    children: "No."
                }, void 0, false, {
                    fileName: "[project]/src/components/VirtualJournalGrid.tsx",
                    lineNumber: 127,
                    columnNumber: 165
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-24",
                    children: "Date"
                }, void 0, false, {
                    fileName: "[project]/src/components/VirtualJournalGrid.tsx",
                    lineNumber: 127,
                    columnNumber: 196
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-24",
                    children: "Debit"
                }, void 0, false, {
                    fileName: "[project]/src/components/VirtualJournalGrid.tsx",
                    lineNumber: 127,
                    columnNumber: 228
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-24",
                    children: "Credit"
                }, void 0, false, {
                    fileName: "[project]/src/components/VirtualJournalGrid.tsx",
                    lineNumber: 127,
                    columnNumber: 261
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-20 text-right",
                    children: "Amount"
                }, void 0, false, {
                    fileName: "[project]/src/components/VirtualJournalGrid.tsx",
                    lineNumber: 127,
                    columnNumber: 295
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 ml-4",
                    children: "Summary"
                }, void 0, false, {
                    fileName: "[project]/src/components/VirtualJournalGrid.tsx",
                    lineNumber: 127,
                    columnNumber: 340
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/VirtualJournalGrid.tsx",
            lineNumber: 127,
            columnNumber: 10
        }, this);
        $[1] = t0;
    } else {
        t0 = $[1];
    }
    let t1;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-full w-full bg-white overflow-hidden flex flex-col",
            children: [
                t0,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$window$2f$dist$2f$react$2d$window$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FixedSizeList"], {
                        height: 600,
                        itemCount: rows.length,
                        itemSize: 40,
                        width: "100%",
                        children: Row
                    }, void 0, false, {
                        fileName: "[project]/src/components/VirtualJournalGrid.tsx",
                        lineNumber: 134,
                        columnNumber: 108
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/VirtualJournalGrid.tsx",
                    lineNumber: 134,
                    columnNumber: 84
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/VirtualJournalGrid.tsx",
            lineNumber: 134,
            columnNumber: 10
        }, this);
        $[2] = t1;
    } else {
        t1 = $[2];
    }
    return t1;
}
_c1 = VirtualJournalGrid;
var _c, _c1;
__turbopack_context__.k.register(_c, "Row");
__turbopack_context__.k.register(_c1, "VirtualJournalGrid");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-compiler-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * @license React
 * react-compiler-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    var ReactSharedInternals = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)").__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    exports.c = function(size) {
        var dispatcher = ReactSharedInternals.H;
        null === dispatcher && console.error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.");
        return dispatcher.useMemoCache(size);
    };
}();
}),
"[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-compiler-runtime.development.js [app-client] (ecmascript)");
}
}),
"[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clsx",
    ()=>clsx,
    "default",
    ()=>__TURBOPACK__default__export__
]);
function r(e) {
    var t, f, n = "";
    if ("string" == typeof e || "number" == typeof e) n += e;
    else if ("object" == typeof e) if (Array.isArray(e)) {
        var o = e.length;
        for(t = 0; t < o; t++)e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
    } else for(f in e)e[f] && (n && (n += " "), n += f);
    return n;
}
function clsx() {
    for(var e, t, f = 0, n = "", o = arguments.length; f < o; f++)(e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
    return n;
}
const __TURBOPACK__default__export__ = clsx;
}),
"[project]/node_modules/react-window/dist/react-window.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Grid",
    ()=>Ee,
    "List",
    ()=>Ae,
    "getScrollbarSize",
    ()=>$e,
    "useDynamicRowHeight",
    ()=>ke,
    "useGridCallbackRef",
    ()=>Ve,
    "useGridRef",
    ()=>Re,
    "useListCallbackRef",
    ()=>Le,
    "useListRef",
    ()=>Me
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
;
function xe(e) {
    let t = e;
    for(; t;){
        if (t.dir) return t.dir === "rtl";
        t = t.parentElement;
    }
    return !1;
}
function ve(e, t) {
    const [s, r] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(t === "rtl");
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])(()=>{
        e && (t || r(xe(e)));
    }, [
        t,
        e
    ]), s;
}
const q = typeof window < "u" ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"] : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"];
function oe(e) {
    if (e !== void 0) switch(typeof e){
        case "number":
            return e;
        case "string":
            {
                if (e.endsWith("px")) return parseFloat(e);
                break;
            }
    }
}
function Ie({ box: e, defaultHeight: t, defaultWidth: s, disabled: r, element: n, mode: o, style: i }) {
    const { styleHeight: f, styleWidth: l } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            styleHeight: oe(i?.height),
            styleWidth: oe(i?.width)
        }), [
        i?.height,
        i?.width
    ]), [c, d] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        height: t,
        width: s
    }), a = r || o === "only-height" && f !== void 0 || o === "only-width" && l !== void 0 || f !== void 0 && l !== void 0;
    return q(()=>{
        if (n === null || a) return;
        const u = new ResizeObserver((I)=>{
            for (const m of I){
                const { contentRect: b, target: g } = m;
                n === g && d((w)=>w.height === b.height && w.width === b.width ? w : {
                        height: b.height,
                        width: b.width
                    });
            }
        });
        return u.observe(n, {
            box: e
        }), ()=>{
            u?.unobserve(n);
        };
    }, [
        e,
        a,
        n,
        f,
        l
    ]), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            height: f ?? c.height,
            width: l ?? c.width
        }), [
        c,
        f,
        l
    ]);
}
function ae(e) {
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(()=>{
        throw new Error("Cannot call during render.");
    });
    return q(()=>{
        t.current = e;
    }, [
        e
    ]), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])((s)=>t.current?.(s), [
        t
    ]);
}
let F = null;
function be(e = !1) {
    if (F === null || e) {
        const t = document.createElement("div"), s = t.style;
        s.width = "50px", s.height = "50px", s.overflow = "scroll", s.direction = "rtl";
        const r = document.createElement("div"), n = r.style;
        return n.width = "100px", n.height = "100px", t.appendChild(r), document.body.appendChild(t), t.scrollLeft > 0 ? F = "positive-descending" : (t.scrollLeft = 1, t.scrollLeft === 0 ? F = "negative" : F = "positive-ascending"), document.body.removeChild(t), F;
    }
    return F;
}
function Z({ containerElement: e, direction: t, isRtl: s, scrollOffset: r }) {
    if (t === "horizontal" && s) switch(be()){
        case "negative":
            return -r;
        case "positive-descending":
            {
                if (e) {
                    const { clientWidth: n, scrollLeft: o, scrollWidth: i } = e;
                    return i - n - o;
                }
                break;
            }
    }
    return r;
}
function $(e, t = "Assertion error") {
    if (!e) throw console.error(t), Error(t);
}
function Y(e, t) {
    if (e === t) return !0;
    if (!!e != !!t || ($(e !== void 0), $(t !== void 0), Object.keys(e).length !== Object.keys(t).length)) return !1;
    for(const s in e)if (!Object.is(t[s], e[s])) return !1;
    return !0;
}
function fe({ cachedBounds: e, itemCount: t, itemSize: s }) {
    if (t === 0) return 0;
    if (typeof s == "number") return t * s;
    {
        const r = e.get(e.size === 0 ? 0 : e.size - 1);
        $(r !== void 0, "Unexpected bounds cache miss");
        const n = (r.scrollOffset + r.size) / e.size;
        return t * n;
    }
}
function we({ align: e, cachedBounds: t, index: s, itemCount: r, itemSize: n, containerScrollOffset: o, containerSize: i }) {
    if (s < 0 || s >= r) throw RangeError(`Invalid index specified: ${s}`, {
        cause: `Index ${s} is not within the range of 0 - ${r - 1}`
    });
    const f = fe({
        cachedBounds: t,
        itemCount: r,
        itemSize: n
    }), l = t.get(s), c = Math.max(0, Math.min(f - i, l.scrollOffset)), d = Math.max(0, l.scrollOffset - i + l.size);
    switch(e === "smart" && (o >= d && o <= c ? e = "auto" : e = "center"), e){
        case "start":
            return c;
        case "end":
            return d;
        case "center":
            return l.scrollOffset <= i / 2 ? 0 : l.scrollOffset + l.size / 2 >= f - i / 2 ? f - i : l.scrollOffset + l.size / 2 - i / 2;
        case "auto":
        default:
            return o >= d && o <= c ? o : o < d ? d : c;
    }
}
function ie({ cachedBounds: e, containerScrollOffset: t, containerSize: s, itemCount: r, overscanCount: n }) {
    const o = r - 1;
    let i = 0, f = -1, l = 0, c = -1, d = 0;
    for(; d < o;){
        const a = e.get(d);
        if (a.scrollOffset + a.size > t) break;
        d++;
    }
    for(i = d, l = Math.max(0, i - n); d < o;){
        const a = e.get(d);
        if (a.scrollOffset + a.size >= t + s) break;
        d++;
    }
    return f = Math.min(o, d), c = Math.min(r - 1, f + n), i < 0 && (i = 0, f = -1, l = 0, c = -1), {
        startIndexVisible: i,
        stopIndexVisible: f,
        startIndexOverscan: l,
        stopIndexOverscan: c
    };
}
function me({ itemCount: e, itemProps: t, itemSize: s }) {
    const r = /* @__PURE__ */ new Map();
    return {
        get (n) {
            for($(n < e, `Invalid index ${n}`); r.size - 1 < n;){
                const i = r.size;
                let f;
                switch(typeof s){
                    case "function":
                        {
                            f = s(i, t);
                            break;
                        }
                    case "number":
                        {
                            f = s;
                            break;
                        }
                }
                if (i === 0) r.set(i, {
                    size: f,
                    scrollOffset: 0
                });
                else {
                    const l = r.get(i - 1);
                    $(l !== void 0, `Unexpected bounds cache miss for index ${n}`), r.set(i, {
                        scrollOffset: l.scrollOffset + l.size,
                        size: f
                    });
                }
            }
            const o = r.get(n);
            return $(o !== void 0, `Unexpected bounds cache miss for index ${n}`), o;
        },
        set (n, o) {
            r.set(n, o);
        },
        get size () {
            return r.size;
        }
    };
}
function Oe({ itemCount: e, itemProps: t, itemSize: s }) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>me({
            itemCount: e,
            itemProps: t,
            itemSize: s
        }), [
        e,
        t,
        s
    ]);
}
function ye({ containerSize: e, itemSize: t }) {
    let s;
    switch(typeof t){
        case "string":
            {
                $(t.endsWith("%"), `Invalid item size: "${t}"; string values must be percentages (e.g. "100%")`), $(e !== void 0, "Container size must be defined if a percentage item size is specified"), s = e * parseInt(t) / 100;
                break;
            }
        default:
            {
                s = t;
                break;
            }
    }
    return s;
}
function ee({ containerElement: e, containerStyle: t, defaultContainerSize: s = 0, direction: r, isRtl: n = !1, itemCount: o, itemProps: i, itemSize: f, onResize: l, overscanCount: c }) {
    const [d, a] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        startIndexVisible: 0,
        startIndexOverscan: 0,
        stopIndexVisible: -1,
        stopIndexOverscan: -1
    }), { startIndexVisible: u, startIndexOverscan: I, stopIndexVisible: m, stopIndexOverscan: b } = {
        startIndexVisible: Math.min(o - 1, d.startIndexVisible),
        startIndexOverscan: Math.min(o - 1, d.startIndexOverscan),
        stopIndexVisible: Math.min(o - 1, d.stopIndexVisible),
        stopIndexOverscan: Math.min(o - 1, d.stopIndexOverscan)
    }, { height: g = s, width: w = s } = Ie({
        defaultHeight: r === "vertical" ? s : void 0,
        defaultWidth: r === "horizontal" ? s : void 0,
        element: e,
        mode: r === "vertical" ? "only-height" : "only-width",
        style: t
    }), y = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])({
        height: 0,
        width: 0
    }), V = r === "vertical" ? g : w, h = ye({
        containerSize: V,
        itemSize: f
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useLayoutEffect"])(()=>{
        if (typeof l == "function") {
            const p = y.current;
            (p.height !== g || p.width !== w) && (l({
                height: g,
                width: w
            }, {
                ...p
            }), p.height = g, p.width = w);
        }
    }, [
        g,
        l,
        w
    ]);
    const z = Oe({
        itemCount: o,
        itemProps: i,
        itemSize: h
    }), k = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])((p)=>z.get(p), [
        z
    ]), S = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])(()=>fe({
            cachedBounds: z,
            itemCount: o,
            itemSize: h
        }), [
        z,
        o,
        h
    ]), W = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])((p)=>{
        const T = Z({
            containerElement: e,
            direction: r,
            isRtl: n,
            scrollOffset: p
        });
        return ie({
            cachedBounds: z,
            containerScrollOffset: T,
            containerSize: V,
            itemCount: o,
            overscanCount: c
        });
    }, [
        z,
        e,
        V,
        r,
        n,
        o,
        c
    ]);
    q(()=>{
        const p = (r === "vertical" ? e?.scrollTop : e?.scrollLeft) ?? 0;
        a(W(p));
    }, [
        e,
        r,
        W
    ]), q(()=>{
        if (!e) return;
        const p = ()=>{
            a((T)=>{
                const { scrollLeft: R, scrollTop: v } = e, x = Z({
                    containerElement: e,
                    direction: r,
                    isRtl: n,
                    scrollOffset: r === "vertical" ? v : R
                }), A = ie({
                    cachedBounds: z,
                    containerScrollOffset: x,
                    containerSize: V,
                    itemCount: o,
                    overscanCount: c
                });
                return Y(A, T) ? T : A;
            });
        };
        return e.addEventListener("scroll", p), ()=>{
            e.removeEventListener("scroll", p);
        };
    }, [
        z,
        e,
        V,
        r,
        o,
        c
    ]);
    const O = ae(({ align: p = "auto", containerScrollOffset: T, index: R })=>{
        let v = we({
            align: p,
            cachedBounds: z,
            containerScrollOffset: T,
            containerSize: V,
            index: R,
            itemCount: o,
            itemSize: h
        });
        if (e) {
            if (v = Z({
                containerElement: e,
                direction: r,
                isRtl: n,
                scrollOffset: v
            }), typeof e.scrollTo != "function") {
                const x = W(v);
                Y(d, x) || a(x);
            }
            return v;
        }
    });
    return {
        getCellBounds: k,
        getEstimatedSize: S,
        scrollToIndex: O,
        startIndexOverscan: I,
        startIndexVisible: u,
        stopIndexOverscan: b,
        stopIndexVisible: m
    };
}
function de(e) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>e, Object.values(e));
}
function ue(e, t) {
    const { ariaAttributes: s, style: r, ...n } = e, { ariaAttributes: o, style: i, ...f } = t;
    return Y(s, o) && Y(r, i) && Y(n, f);
}
function Ee({ cellComponent: e, cellProps: t, children: s, className: r, columnCount: n, columnWidth: o, defaultHeight: i = 0, defaultWidth: f = 0, dir: l, gridRef: c, onCellsRendered: d, onResize: a, overscanCount: u = 3, rowCount: I, rowHeight: m, style: b, tagName: g = "div", ...w }) {
    const y = de(t), V = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memo"])(e, ue), [
        e
    ]), [h, z] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null), k = ve(h, l), { getCellBounds: S, getEstimatedSize: W, startIndexOverscan: O, startIndexVisible: p, scrollToIndex: T, stopIndexOverscan: R, stopIndexVisible: v } = ee({
        containerElement: h,
        containerStyle: b,
        defaultContainerSize: f,
        direction: "horizontal",
        isRtl: k,
        itemCount: n,
        itemProps: y,
        itemSize: o,
        onResize: a,
        overscanCount: u
    }), { getCellBounds: x, getEstimatedSize: A, startIndexOverscan: M, startIndexVisible: re, scrollToIndex: Q, stopIndexOverscan: _, stopIndexVisible: ne } = ee({
        containerElement: h,
        containerStyle: b,
        defaultContainerSize: i,
        direction: "vertical",
        itemCount: I,
        itemProps: y,
        itemSize: m,
        onResize: a,
        overscanCount: u
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useImperativeHandle"])(c, ()=>({
            get element () {
                return h;
            },
            scrollToCell ({ behavior: B = "auto", columnAlign: E = "auto", columnIndex: j, rowAlign: D = "auto", rowIndex: G }) {
                const N = T({
                    align: E,
                    containerScrollOffset: h?.scrollLeft ?? 0,
                    index: j
                }), ge = Q({
                    align: D,
                    containerScrollOffset: h?.scrollTop ?? 0,
                    index: G
                });
                typeof h?.scrollTo == "function" && h.scrollTo({
                    behavior: B,
                    left: N,
                    top: ge
                });
            },
            scrollToColumn ({ align: B = "auto", behavior: E = "auto", index: j }) {
                const D = T({
                    align: B,
                    containerScrollOffset: h?.scrollLeft ?? 0,
                    index: j
                });
                typeof h?.scrollTo == "function" && h.scrollTo({
                    behavior: E,
                    left: D
                });
            },
            scrollToRow ({ align: B = "auto", behavior: E = "auto", index: j }) {
                const D = Q({
                    align: B,
                    containerScrollOffset: h?.scrollTop ?? 0,
                    index: j
                });
                typeof h?.scrollTo == "function" && h.scrollTo({
                    behavior: E,
                    top: D
                });
            }
        }), [
        h,
        T,
        Q
    ]), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        O >= 0 && R >= 0 && M >= 0 && _ >= 0 && d && d({
            columnStartIndex: p,
            columnStopIndex: v,
            rowStartIndex: re,
            rowStopIndex: ne
        }, {
            columnStartIndex: O,
            columnStopIndex: R,
            rowStartIndex: M,
            rowStopIndex: _
        });
    }, [
        d,
        O,
        p,
        R,
        v,
        M,
        re,
        _,
        ne
    ]);
    const he = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const B = [];
        if (n > 0 && I > 0) for(let E = M; E <= _; E++){
            const j = x(E), D = [];
            for(let G = O; G <= R; G++){
                const N = S(G);
                D.push(/* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])(V, {
                    ...y,
                    ariaAttributes: {
                        "aria-colindex": G + 1,
                        role: "gridcell"
                    },
                    columnIndex: G,
                    key: G,
                    rowIndex: E,
                    style: {
                        position: "absolute",
                        left: k ? void 0 : 0,
                        right: k ? 0 : void 0,
                        transform: `translate(${k ? -N.scrollOffset : N.scrollOffset}px, ${j.scrollOffset}px)`,
                        height: j.size,
                        width: N.size
                    }
                }));
            }
            B.push(/* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])("div", {
                role: "row",
                "aria-rowindex": E + 1,
                children: D
            }, E));
        }
        return B;
    }, [
        V,
        y,
        n,
        O,
        R,
        S,
        x,
        k,
        I,
        M,
        _
    ]), pe = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])("div", {
        "aria-hidden": !0,
        style: {
            height: A(),
            width: W(),
            zIndex: -1
        }
    });
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])(g, {
        "aria-colcount": n,
        "aria-rowcount": I,
        role: "grid",
        ...w,
        className: r,
        dir: l,
        ref: z,
        style: {
            position: "relative",
            width: "100%",
            height: "100%",
            maxHeight: "100%",
            maxWidth: "100%",
            flexGrow: 1,
            overflow: "auto",
            ...b
        }
    }, he, s, pe);
}
const Ve = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"], Re = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"];
function ze(e) {
    return e != null && typeof e == "object" && "getAverageRowHeight" in e && typeof e.getAverageRowHeight == "function";
}
const te = "data-react-window-index";
function Ae({ children: e, className: t, defaultHeight: s = 0, listRef: r, onResize: n, onRowsRendered: o, overscanCount: i = 3, rowComponent: f, rowCount: l, rowHeight: c, rowProps: d, tagName: a = "div", style: u, ...I }) {
    const m = de(d), b = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["memo"])(f, ue), [
        f
    ]), [g, w] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null), y = ze(c), V = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>y ? (v)=>c.getRowHeight(v) ?? c.getAverageRowHeight() : c, [
        y,
        c
    ]), { getCellBounds: h, getEstimatedSize: z, scrollToIndex: k, startIndexOverscan: S, startIndexVisible: W, stopIndexOverscan: O, stopIndexVisible: p } = ee({
        containerElement: g,
        containerStyle: u,
        defaultContainerSize: s,
        direction: "vertical",
        itemCount: l,
        itemProps: m,
        itemSize: V,
        onResize: n,
        overscanCount: i
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useImperativeHandle"])(r, ()=>({
            get element () {
                return g;
            },
            scrollToRow ({ align: v = "auto", behavior: x = "auto", index: A }) {
                const M = k({
                    align: v,
                    containerScrollOffset: g?.scrollTop ?? 0,
                    index: A
                });
                typeof g?.scrollTo == "function" && g.scrollTo({
                    behavior: x,
                    top: M
                });
            }
        }), [
        g,
        k
    ]), q(()=>{
        if (!g) return;
        const v = Array.from(g.children).filter((x, A)=>{
            if (x.hasAttribute("aria-hidden")) return !1;
            const M = `${S + A}`;
            return x.setAttribute(te, M), !0;
        });
        if (y) return c.observeRowElements(v);
    }, [
        g,
        y,
        c,
        S,
        O
    ]), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        S >= 0 && O >= 0 && o && o({
            startIndex: W,
            stopIndex: p
        }, {
            startIndex: S,
            stopIndex: O
        });
    }, [
        o,
        S,
        W,
        O,
        p
    ]);
    const T = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>{
        const v = [];
        if (l > 0) for(let x = S; x <= O; x++){
            const A = h(x);
            v.push(/* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])(b, {
                ...m,
                ariaAttributes: {
                    "aria-posinset": x + 1,
                    "aria-setsize": l,
                    role: "listitem"
                },
                key: x,
                index: x,
                style: {
                    position: "absolute",
                    left: 0,
                    transform: `translateY(${A.scrollOffset}px)`,
                    // In case of dynamic row heights, don't specify a height style
                    // otherwise a default/estimated height would mask the actual height
                    height: y ? void 0 : A.size,
                    width: "100%"
                }
            }));
        }
        return v;
    }, [
        b,
        h,
        y,
        l,
        m,
        S,
        O
    ]), R = /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsx"])("div", {
        "aria-hidden": !0,
        style: {
            height: z(),
            width: "100%",
            zIndex: -1
        }
    });
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createElement"])(a, {
        role: "list",
        ...I,
        className: t,
        ref: w,
        style: {
            position: "relative",
            maxHeight: "100%",
            flexGrow: 1,
            overflowY: "auto",
            ...u
        }
    }, T, e, R);
}
function ke({ defaultRowHeight: e, key: t }) {
    const [s, r] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        key: t,
        map: /* @__PURE__ */ new Map()
    });
    s.key !== t && r({
        key: t,
        map: /* @__PURE__ */ new Map()
    });
    const { map: n } = s, o = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])(()=>{
        let a = 0;
        return n.forEach((u)=>{
            a += u;
        }), a === 0 ? e : a / n.size;
    }, [
        e,
        n
    ]), i = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])((a)=>{
        const u = n.get(a);
        return u !== void 0 ? u : (n.set(a, e), e);
    }, [
        e,
        n
    ]), f = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])((a, u)=>{
        r((I)=>{
            if (I.map.get(a) === u) return I;
            const m = new Map(I.map);
            return m.set(a, u), {
                ...I,
                map: m
            };
        });
    }, []), l = ae((a)=>{
        a.length !== 0 && a.forEach((u)=>{
            const { borderBoxSize: I, target: m } = u, b = m.getAttribute(te);
            $(b !== null, `Invalid ${te} attribute value`);
            const g = parseInt(b), { blockSize: w } = I[0];
            w && f(g, w);
        });
    }), [c] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(()=>new ResizeObserver(l));
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(()=>()=>{
            c.disconnect();
        }, [
        c
    ]);
    const d = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])((a)=>(a.forEach((u)=>c.observe(u)), ()=>{
            a.forEach((u)=>c.unobserve(u));
        }), [
        c
    ]);
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])(()=>({
            getAverageRowHeight: o,
            getRowHeight: i,
            setRowHeight: f,
            observeRowElements: d
        }), [
        o,
        i,
        f,
        d
    ]);
}
const Le = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"], Me = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"];
let C = -1;
function $e(e = !1) {
    if (C === -1 || e) {
        const t = document.createElement("div"), s = t.style;
        s.width = "50px", s.height = "50px", s.overflow = "scroll", document.body.appendChild(t), C = t.offsetWidth - t.clientWidth, document.body.removeChild(t);
    }
    return C;
}
;
 //# sourceMappingURL=react-window.js.map
}),
]);

//# sourceMappingURL=_9f42d5da._.js.map