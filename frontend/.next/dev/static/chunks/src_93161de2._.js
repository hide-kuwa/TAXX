(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/ui/DrumRoll.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DrumRoll",
    ()=>DrumRoll
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
const DrumRoll = (t0)=>{
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(19);
    if ($[0] !== "54bc765fe94f10ef7da71c255b7a9d0a4a5aa8f95d8e41c43d8d8a8f6251f819") {
        for(let $i = 0; $i < 19; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "54bc765fe94f10ef7da71c255b7a9d0a4a5aa8f95d8e41c43d8d8a8f6251f819";
    }
    const { items, direction, selectedId, onSelect } = t0;
    const scrollerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const isVertical = direction === "vertical";
    let t1;
    let t2;
    if ($[1] !== isVertical || $[2] !== items || $[3] !== onSelect || $[4] !== selectedId) {
        t1 = ()=>{
            const scroller = scrollerRef.current;
            if (!scroller) {
                return;
            }
            let timeoutId;
            const handleScroll = ()=>{
                clearTimeout(timeoutId);
                timeoutId = setTimeout(()=>{
                    const center = isVertical ? scroller.scrollTop + scroller.clientHeight / 2 : scroller.scrollLeft + scroller.clientWidth / 2;
                    let closest = null;
                    let minDiff = Infinity;
                    const itemElements = Array.from(scroller.children);
                    itemElements.forEach((el)=>{
                        if (el.dataset.type === "spacer") {
                            return;
                        }
                        const itemCenter = isVertical ? el.offsetTop + el.clientHeight / 2 : el.offsetLeft + el.clientWidth / 2;
                        const diff = Math.abs(center - itemCenter);
                        if (diff < minDiff) {
                            minDiff = diff;
                            const itemId = el.dataset.id;
                            if (itemId) {
                                closest = items.find((i)=>i.id === itemId) || null;
                            }
                        }
                    });
                    if (closest && closest.id !== selectedId) {
                        onSelect(closest.id);
                    }
                }, 50);
            };
            scroller.addEventListener("scroll", handleScroll);
            return ()=>{
                scroller.removeEventListener("scroll", handleScroll);
                clearTimeout(timeoutId);
            };
        };
        t2 = [
            items,
            isVertical,
            selectedId,
            onSelect
        ];
        $[1] = isVertical;
        $[2] = items;
        $[3] = onSelect;
        $[4] = selectedId;
        $[5] = t1;
        $[6] = t2;
    } else {
        t1 = $[5];
        t2 = $[6];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])(t1, t2);
    let t3;
    let t4;
    let t5;
    if ($[7] !== isVertical || $[8] !== items || $[9] !== selectedId) {
        const scrollToItem = (index)=>{
            const scroller_0 = scrollerRef.current;
            if (!scroller_0) {
                return;
            }
            const itemNodes = Array.from(scroller_0.children).filter(_temp);
            const targetEl = itemNodes[index];
            if (targetEl) {
                const top = isVertical ? targetEl.offsetTop - scroller_0.clientHeight / 2 + targetEl.clientHeight / 2 : 0;
                const left = !isVertical ? targetEl.offsetLeft - scroller_0.clientWidth / 2 + targetEl.clientWidth / 2 : 0;
                scroller_0.scrollTo({
                    top,
                    left,
                    behavior: "smooth"
                });
            }
        };
        t3 = scrollerRef;
        const t6 = isVertical ? "flex-col h-full w-full overflow-y-auto snap-y snap-mandatory py-[40vh]" : "flex-row w-full h-full overflow-x-auto snap-x snap-mandatory px-[50vw] items-center";
        if ($[13] !== t6) {
            t4 = cn("relative scroll-smooth hide-scrollbar flex z-10", t6);
            $[13] = t6;
            $[14] = t4;
        } else {
            t4 = $[14];
        }
        t5 = items.map((item, index_0)=>{
            const isActive = item.id === selectedId;
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                "data-id": item.id,
                onClick: ()=>scrollToItem(index_0),
                className: cn("flex-shrink-0 cursor-pointer transition-all duration-300 snap-center flex flex-col items-center justify-center select-none", isVertical ? "w-full py-6" : "h-full w-48", isActive ? "opacity-100 scale-110 text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" : "opacity-40 scale-90 text-slate-400 hover:opacity-60"),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: cn("font-black tracking-tighter leading-none", isVertical ? "text-3xl" : "text-sm"),
                        children: item.label
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/DrumRoll.tsx",
                        lineNumber: 118,
                        columnNumber: 421
                    }, ("TURBOPACK compile-time value", void 0)),
                    item.subLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[10px] font-bold opacity-70 mt-1 tracking-widest uppercase",
                        children: item.subLabel
                    }, void 0, false, {
                        fileName: "[project]/src/components/ui/DrumRoll.tsx",
                        lineNumber: 118,
                        columnNumber: 558
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, item.id, true, {
                fileName: "[project]/src/components/ui/DrumRoll.tsx",
                lineNumber: 118,
                columnNumber: 14
            }, ("TURBOPACK compile-time value", void 0));
        });
        $[7] = isVertical;
        $[8] = items;
        $[9] = selectedId;
        $[10] = t3;
        $[11] = t4;
        $[12] = t5;
    } else {
        t3 = $[10];
        t4 = $[11];
        t5 = $[12];
    }
    let t6;
    if ($[15] !== t3 || $[16] !== t4 || $[17] !== t5) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            ref: t3,
            className: t4,
            children: t5
        }, void 0, false, {
            fileName: "[project]/src/components/ui/DrumRoll.tsx",
            lineNumber: 133,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[15] = t3;
        $[16] = t4;
        $[17] = t5;
        $[18] = t6;
    } else {
        t6 = $[18];
    }
    return t6;
};
_s(DrumRoll, "kjpdbaZWYZOFHYnVJFSIl+PEWHU=");
_c = DrumRoll;
function _temp(el_0) {
    return el_0.dataset.type !== "spacer";
}
var _c;
__turbopack_context__.k.register(_c, "DrumRoll");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/layout/MatrixLayout.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MatrixLayout",
    ()=>MatrixLayout
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/compiler-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
const MatrixLayout = (t0)=>{
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$compiler$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["c"])(47);
    if ($[0] !== "bb09669c96d705af0d25825c35db65ddeb78a971a7b4559db1b77049c0d60082") {
        for(let $i = 0; $i < 47; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "bb09669c96d705af0d25825c35db65ddeb78a971a7b4559db1b77049c0d60082";
    }
    const { topDrum, leftDrum, children, headerTitle, progress, progressColor: t1 } = t0;
    const progressColor = t1 === undefined ? "text-blue-600" : t1;
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const circumference = 2 * Math.PI * 20;
    const strokeDashoffset = circumference - progress / 100 * circumference;
    let t2;
    let t3;
    let t4;
    let t5;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute left-1/2 -translate-x-1/2 bottom-0 w-[200px] h-full bg-white/5 border-x border-white/10 pointer-events-none z-0"
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 39,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-blue-500 z-40"
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 40,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute left-0 top-0 h-full w-32 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none z-20"
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 41,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-20"
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 42,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[1] = t2;
        $[2] = t3;
        $[3] = t4;
        $[4] = t5;
    } else {
        t2 = $[1];
        t3 = $[2];
        t4 = $[3];
        t5 = $[4];
    }
    let t6;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute left-6 top-1/2 -translate-y-1/2 z-50 text-white font-black italic text-xl tracking-tighter select-none",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-blue-500",
                    children: "Docu"
                }, void 0, false, {
                    fileName: "[project]/src/components/layout/MatrixLayout.tsx",
                    lineNumber: 55,
                    columnNumber: 139
                }, ("TURBOPACK compile-time value", void 0)),
                "Grid"
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 55,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[5] = t6;
    } else {
        t6 = $[5];
    }
    let t7;
    if ($[6] !== topDrum) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
            className: "h-20 bg-slate-900 border-b border-slate-700 relative flex-shrink-0 z-30 shadow-xl",
            children: [
                t2,
                t3,
                t4,
                t5,
                t6,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full h-full relative z-10",
                    children: topDrum
                }, void 0, false, {
                    fileName: "[project]/src/components/layout/MatrixLayout.tsx",
                    lineNumber: 62,
                    columnNumber: 129
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 62,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[6] = topDrum;
        $[7] = t7;
    } else {
        t7 = $[7];
    }
    let t10;
    let t8;
    let t9;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-1/2 -translate-y-1/2 w-full h-20 bg-white/5 border-y border-white/10 pointer-events-none z-0"
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 72,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none z-20"
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 73,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none z-20"
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 74,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[8] = t10;
        $[9] = t8;
        $[10] = t9;
    } else {
        t10 = $[8];
        t8 = $[9];
        t9 = $[10];
    }
    let t11;
    if ($[11] !== leftDrum) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-full w-full relative z-10",
            children: leftDrum
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 85,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[11] = leftDrum;
        $[12] = t11;
    } else {
        t11 = $[12];
    }
    let t12;
    if ($[13] !== router) {
        t12 = ()=>router.push("/settings");
        $[13] = router;
        $[14] = t12;
    } else {
        t12 = $[14];
    }
    let t13;
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-xl",
            children: "⚙"
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 101,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[15] = t13;
    } else {
        t13 = $[15];
    }
    let t14;
    if ($[16] !== t12) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute bottom-0 left-0 w-full h-20 flex items-center justify-center border-t border-slate-800 z-30 bg-slate-900/95 backdrop-blur-sm",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: t12,
                className: "w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg border border-slate-700 hover:border-slate-500",
                title: "\u8A2D\u5B9A",
                children: t13
            }, void 0, false, {
                fileName: "[project]/src/components/layout/MatrixLayout.tsx",
                lineNumber: 108,
                columnNumber: 162
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 108,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[16] = t12;
        $[17] = t14;
    } else {
        t14 = $[17];
    }
    let t15;
    if ($[18] !== t11 || $[19] !== t14) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
            className: "w-24 bg-slate-900 h-full relative flex-shrink-0 z-20 shadow-2xl border-r border-slate-700",
            children: [
                t8,
                t9,
                t10,
                t11,
                t14
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 116,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[18] = t11;
        $[19] = t14;
        $[20] = t15;
    } else {
        t15 = $[20];
    }
    let t16;
    if ($[21] !== headerTitle) {
        t16 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: headerTitle
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 125,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[21] = headerTitle;
        $[22] = t16;
    } else {
        t16 = $[22];
    }
    const t17 = `text-2xl font-black transition-colors duration-500 ${progress === 100 ? "text-green-500" : progressColor}`;
    let t18;
    if ($[23] !== progress || $[24] !== t17) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-right",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: t17,
                children: [
                    progress,
                    "%"
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/layout/MatrixLayout.tsx",
                lineNumber: 134,
                columnNumber: 39
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 134,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[23] = progress;
        $[24] = t17;
        $[25] = t18;
    } else {
        t18 = $[25];
    }
    let t19;
    if ($[26] === Symbol.for("react.memo_cache_sentinel")) {
        t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
            cx: "24",
            cy: "24",
            r: 20,
            stroke: "#e2e8f0",
            strokeWidth: "4",
            fill: "transparent"
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 143,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[26] = t19;
    } else {
        t19 = $[26];
    }
    const t20 = `transition-all duration-700 ${progress === 100 ? "text-green-500" : "text-blue-500"}`;
    let t21;
    if ($[27] !== strokeDashoffset || $[28] !== t20) {
        t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-12 h-12 relative flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                className: "transform -rotate-90 w-12 h-12",
                children: [
                    t19,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                        cx: "24",
                        cy: "24",
                        r: 20,
                        stroke: "currentColor",
                        strokeWidth: "4",
                        fill: "transparent",
                        strokeDasharray: circumference,
                        strokeDashoffset: strokeDashoffset,
                        className: t20
                    }, void 0, false, {
                        fileName: "[project]/src/components/layout/MatrixLayout.tsx",
                        lineNumber: 151,
                        columnNumber: 133
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/layout/MatrixLayout.tsx",
                lineNumber: 151,
                columnNumber: 80
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 151,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[27] = strokeDashoffset;
        $[28] = t20;
        $[29] = t21;
    } else {
        t21 = $[29];
    }
    let t22;
    if ($[30] !== t18 || $[31] !== t21) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-3",
            children: [
                t18,
                t21
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 160,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[30] = t18;
        $[31] = t21;
        $[32] = t22;
    } else {
        t22 = $[32];
    }
    let t23;
    if ($[33] !== t16 || $[34] !== t22) {
        t23 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
            className: "bg-white/80 backdrop-blur px-8 py-3 border-b border-slate-200 flex justify-between items-center z-10 shadow-sm",
            children: [
                t16,
                t22
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 169,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[33] = t16;
        $[34] = t22;
        $[35] = t23;
    } else {
        t23 = $[35];
    }
    let t24;
    if ($[36] !== children) {
        t24 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex-1 overflow-y-auto p-8 relative",
            children: children
        }, void 0, false, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 178,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[36] = children;
        $[37] = t24;
    } else {
        t24 = $[37];
    }
    let t25;
    if ($[38] !== t23 || $[39] !== t24) {
        t25 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
            className: "flex-1 flex flex-col bg-slate-100 relative min-w-0",
            children: [
                t23,
                t24
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 186,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[38] = t23;
        $[39] = t24;
        $[40] = t25;
    } else {
        t25 = $[40];
    }
    let t26;
    if ($[41] !== t15 || $[42] !== t25) {
        t26 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-1 overflow-hidden",
            children: [
                t15,
                t25
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 195,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[41] = t15;
        $[42] = t25;
        $[43] = t26;
    } else {
        t26 = $[43];
    }
    let t27;
    if ($[44] !== t26 || $[45] !== t7) {
        t27 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col h-screen bg-slate-100 overflow-hidden font-sans text-slate-600",
            children: [
                t7,
                t26
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/layout/MatrixLayout.tsx",
            lineNumber: 204,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[44] = t26;
        $[45] = t7;
        $[46] = t27;
    } else {
        t27 = $[46];
    }
    return t27;
};
_s(MatrixLayout, "fN7XvhJ+p5oE6+Xlo0NJmXpxjC8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = MatrixLayout;
var _c;
__turbopack_context__.k.register(_c, "MatrixLayout");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>DocuGridPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$DrumRoll$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/DrumRoll.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$MatrixLayout$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/MatrixLayout.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
// --- 初期データ ---
const INITIAL_TEMPLATES = {
    year: [
        {
            title: '決算報告書'
        },
        {
            title: '総勘定元帳'
        },
        {
            title: '法人税申告書'
        },
        {
            title: '消費税申告書'
        },
        {
            title: '勘定科目内訳書'
        }
    ],
    perm: [
        {
            title: '定款'
        },
        {
            title: '履歴事項全部証明書'
        },
        {
            title: '株主名簿'
        },
        {
            title: '設立届出書'
        }
    ]
};
const INITIAL_CLIENTS = [
    {
        id: 'c1',
        label: '株式会社 鈴木商店',
        subLabel: 'ID: 1001',
        clientDriveSetting: {
            isConnected: true,
            folderId: 'folder_abc'
        }
    },
    {
        id: 'c2',
        label: '合同会社 テック',
        subLabel: 'ID: 1002'
    },
    {
        id: 'c3',
        label: '佐藤 健太（個人）',
        subLabel: 'ID: 2005'
    },
    {
        id: 'c4',
        label: '山田不動産',
        subLabel: 'ID: 3040'
    },
    {
        id: 'c5',
        label: '東京コンサルティング',
        subLabel: 'ID: 5001'
    }
];
const INITIAL_PERIODS = [
    {
        id: 'perm',
        label: '永続',
        subLabel: 'PERMANENT',
        type: 'special'
    },
    {
        id: 'r6',
        label: 'R6',
        subLabel: '2024'
    },
    {
        id: 'r5',
        label: 'R5',
        subLabel: '2023'
    },
    {
        id: 'r4',
        label: 'R4',
        subLabel: '2022'
    }
];
const MOCK_DRIVE_STORAGE = [
    {
        key: 'c1-r5',
        title: '決算報告書',
        category: 'template',
        url: null
    },
    {
        key: 'c1-r5',
        title: '法人税申告書',
        category: 'template',
        url: null
    }
];
function DocuGridPage() {
    _s();
    const [clients, setClients] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(INITIAL_CLIENTS);
    const [periods, setPeriods] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(INITIAL_PERIODS);
    const [clientId, setClientId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(clients[0].id);
    const [periodId, setPeriodId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(periods[1].id);
    // UI制御
    const [searchTerm, setSearchTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [isSearchOpen, setIsSearchOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [clientSort, setClientSort] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('default');
    const [periodSort, setPeriodSort] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('newest');
    const [isTemplateEditMode, setIsTemplateEditMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [templates, setTemplates] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(INITIAL_TEMPLATES);
    const [viewStateFiles, setViewStateFiles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [uploadTarget, setUploadTarget] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isUploading, setIsUploading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [previewFile, setPreviewFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "DocuGridPage.useEffect": ()=>{
            setViewStateFiles([
                ...MOCK_DRIVE_STORAGE
            ]);
        }
    }["DocuGridPage.useEffect"], []);
    // --- フィルタリング & ソート ---
    const filteredClients = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "DocuGridPage.useMemo[filteredClients]": ()=>{
            let result = [
                ...clients
            ];
            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                result = result.filter({
                    "DocuGridPage.useMemo[filteredClients]": (c)=>c.label.toLowerCase().includes(lower) || c.subLabel?.toLowerCase().includes(lower)
                }["DocuGridPage.useMemo[filteredClients]"]);
            }
            if (clientSort === 'name') {
                result.sort({
                    "DocuGridPage.useMemo[filteredClients]": (a, b)=>a.label.localeCompare(b.label, 'ja')
                }["DocuGridPage.useMemo[filteredClients]"]);
            } else if (clientSort === 'id') {
                result.sort({
                    "DocuGridPage.useMemo[filteredClients]": (a_0, b_0)=>(a_0.subLabel || '').localeCompare(b_0.subLabel || '')
                }["DocuGridPage.useMemo[filteredClients]"]);
            }
            return result;
        }
    }["DocuGridPage.useMemo[filteredClients]"], [
        clients,
        searchTerm,
        clientSort
    ]);
    const sortedPeriods = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "DocuGridPage.useMemo[sortedPeriods]": ()=>{
            let result_0 = [
                ...periods
            ];
            const perm = result_0.find({
                "DocuGridPage.useMemo[sortedPeriods].perm": (p)=>p.id === 'perm'
            }["DocuGridPage.useMemo[sortedPeriods].perm"]);
            const others = result_0.filter({
                "DocuGridPage.useMemo[sortedPeriods].others": (p_0)=>p_0.id !== 'perm'
            }["DocuGridPage.useMemo[sortedPeriods].others"]);
            if (periodSort !== 'newest') others.reverse();
            return perm ? [
                perm,
                ...others
            ] : others;
        }
    }["DocuGridPage.useMemo[sortedPeriods]"], [
        periods,
        periodSort
    ]);
    // --- ハンドラ ---
    const handleAddClient = ()=>{
        const name = prompt("新しい取引先名を入力してください");
        if (!name) return;
        const code = prompt("管理コードを入力してください", Math.floor(1000 + Math.random() * 9000).toString());
        const newClient = {
            id: `c_${Date.now()}`,
            label: name,
            subLabel: `ID: ${code || '0000'}`
        };
        setClients((prev)=>[
                ...prev,
                newClient
            ]);
        setClientId(newClient.id);
    };
    const handleAddPeriod = ()=>{
        const label = prompt("新しい年度を入力してください（例：R7）");
        if (!label) return;
        const year = prompt("西暦を入力してください", new Date().getFullYear().toString());
        const newPeriod = {
            id: `p_${Date.now()}`,
            label: label,
            subLabel: year || ''
        };
        setPeriods((prev_0)=>{
            const [perm_0, ...rest] = prev_0;
            return [
                perm_0,
                newPeriod,
                ...rest
            ];
        });
        setPeriodId(newPeriod.id);
    };
    // ファイル操作系
    const handleUploadClick = (title, category)=>{
        if (isTemplateEditMode) return;
        setUploadTarget({
            title,
            category
        });
        fileInputRef.current?.click();
    };
    const handleFileChange = async (e)=>{
        const file = e.target.files?.[0];
        if (!file || !uploadTarget) return;
        setIsUploading(true);
        const key = `${clientId}-${periodId}`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folderName', `Client_${clientId}/${periodId}`);
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            if (!res.ok) throw new Error('Upload failed');
            const objectUrl = URL.createObjectURL(file);
            const newFile = {
                key: key,
                title: uploadTarget.category === 'template' ? uploadTarget.title : file.name,
                category: uploadTarget.category,
                url: objectUrl
            };
            setViewStateFiles((prev_1)=>[
                    ...prev_1,
                    newFile
                ]);
            MOCK_DRIVE_STORAGE.push(newFile);
        } catch (error) {
            alert('アップロードに失敗しました');
        } finally{
            setIsUploading(false);
            setUploadTarget(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };
    const handleCardClick = (item)=>{
        if (isTemplateEditMode) return;
        if (item.isFilled) {
            const key_0 = `${clientId}-${periodId}`;
            const targetFile = viewStateFiles.find((f)=>f.key === key_0 && f.title === item.title);
            setPreviewFile({
                title: item.title,
                url: targetFile?.url || null
            });
        } else {
            handleUploadClick(item.title, item.category);
        }
    };
    const handleUnlinkFile = (fileTitle)=>{
        const key_1 = `${clientId}-${periodId}`;
        if (!confirm(`「${fileTitle}」の連携を解除しますか？`)) return;
        setViewStateFiles((prev_2)=>prev_2.filter((f_0)=>!(f_0.key === key_1 && f_0.title === fileTitle)));
    };
    const handleResync = ()=>{
        const key_2 = `${clientId}-${periodId}`;
        const currentTitles = viewStateFiles.filter((f_1)=>f_1.key === key_2).map((f_2)=>f_2.title);
        const missingFiles = MOCK_DRIVE_STORAGE.filter((f_3)=>f_3.key === key_2 && !currentTitles.includes(f_3.title));
        if (missingFiles.length > 0) {
            setViewStateFiles((prev_3)=>[
                    ...prev_3,
                    ...missingFiles
                ]);
            alert(`${missingFiles.length}件のファイルを復元しました。`);
        } else {
            alert("同期ズレはありません。");
        }
    };
    const handleAddTemplate = ()=>{
        const name_0 = prompt("新しい必須書類の名称を入力してください");
        if (!name_0) return;
        const type = periodId === 'perm' ? 'perm' : 'year';
        setTemplates((prev_4)=>({
                ...prev_4,
                [type]: [
                    ...prev_4[type],
                    {
                        title: name_0
                    }
                ]
            }));
    };
    const handleDeleteTemplate = (titleToDelete)=>{
        if (!confirm(`必須枠「${titleToDelete}」を削除しますか？`)) return;
        const type_0 = periodId === 'perm' ? 'perm' : 'year';
        setTemplates((prev_5)=>({
                ...prev_5,
                [type_0]: prev_5[type_0].filter((t)=>t.title !== titleToDelete)
            }));
    };
    const currentData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "DocuGridPage.useMemo[currentData]": ()=>{
            const key_3 = `${clientId}-${periodId}`;
            const uploads = viewStateFiles.filter({
                "DocuGridPage.useMemo[currentData].uploads": (f_4)=>f_4.key === key_3
            }["DocuGridPage.useMemo[currentData].uploads"]);
            const templateType = periodId === 'perm' ? 'perm' : 'year';
            const requiredDocs = templates[templateType].map({
                "DocuGridPage.useMemo[currentData].requiredDocs": (tmpl, idx)=>{
                    const isUploaded = uploads.some({
                        "DocuGridPage.useMemo[currentData].requiredDocs.isUploaded": (u)=>u.category === 'template' && u.title === tmpl.title
                    }["DocuGridPage.useMemo[currentData].requiredDocs.isUploaded"]);
                    return {
                        id: `req-${idx}`,
                        title: tmpl.title,
                        isFilled: isUploaded,
                        category: 'template'
                    };
                }
            }["DocuGridPage.useMemo[currentData].requiredDocs"]);
            const templateTitles = templates[templateType].map({
                "DocuGridPage.useMemo[currentData].templateTitles": (t_0)=>t_0.title
            }["DocuGridPage.useMemo[currentData].templateTitles"]);
            const customDocs = uploads.filter({
                "DocuGridPage.useMemo[currentData].customDocs": (u_0)=>!templateTitles.includes(u_0.title)
            }["DocuGridPage.useMemo[currentData].customDocs"]).map({
                "DocuGridPage.useMemo[currentData].customDocs": (u_1, idx_0)=>({
                        id: `custom-${idx_0}`,
                        title: u_1.title,
                        isFilled: true,
                        category: 'custom'
                    })
            }["DocuGridPage.useMemo[currentData].customDocs"]);
            return [
                ...requiredDocs,
                ...customDocs
            ];
        }
    }["DocuGridPage.useMemo[currentData]"], [
        clientId,
        periodId,
        templates,
        viewStateFiles
    ]);
    const progress = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "DocuGridPage.useMemo[progress]": ()=>{
            const requiredOnly = currentData.filter({
                "DocuGridPage.useMemo[progress].requiredOnly": (d)=>d.category === 'template'
            }["DocuGridPage.useMemo[progress].requiredOnly"]);
            if (!requiredOnly.length) return 0;
            const filled = requiredOnly.filter({
                "DocuGridPage.useMemo[progress]": (d_0)=>d_0.isFilled
            }["DocuGridPage.useMemo[progress]"]).length;
            return Math.round(filled / requiredOnly.length * 100);
        }
    }["DocuGridPage.useMemo[progress]"], [
        currentData
    ]);
    const selectedClient = clients.find((c_0)=>c_0.id === clientId);
    const selectedPeriod = periods.find((p_1)=>p_1.id === periodId);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$MatrixLayout$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MatrixLayout"], {
        // ★上部ドラム：シンプルさを取り戻す！
        topDrum: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative w-full h-full flex items-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 h-full overflow-hidden",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$DrumRoll$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DrumRoll"], {
                        items: filteredClients,
                        direction: "horizontal",
                        selectedId: clientId,
                        onSelect: setClientId
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 287,
                        columnNumber: 14
                    }, void 0)
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 286,
                    columnNumber: 11
                }, void 0),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-[#0f172a] to-transparent pointer-events-none z-10"
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 291,
                    columnNumber: 11
                }, void 0),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 z-50",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setIsSearchOpen(!isSearchOpen),
                            className: `w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-lg border border-white/10 ${isSearchOpen ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`,
                            title: "検索・並び替え",
                            children: "🔍"
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 297,
                            columnNumber: 13
                        }, void 0),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleAddClient,
                            className: "w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-lg border border-white/10",
                            title: "取引先を追加",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-lg font-bold pb-1",
                                children: "+"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 303,
                                columnNumber: 15
                            }, void 0)
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 302,
                            columnNumber: 13
                        }, void 0)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 294,
                    columnNumber: 11
                }, void 0),
                isSearchOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-full right-4 mt-2 w-64 bg-slate-800 p-4 rounded-xl shadow-2xl border border-slate-700 z-[100] animate-[fadeInDown_0.2s_ease-out]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            autoFocus: true,
                            placeholder: "取引先を検索...",
                            value: searchTerm,
                            onChange: (e_0)=>setSearchTerm(e_0.target.value),
                            className: "w-full bg-slate-900 text-white text-sm px-3 py-2 rounded-lg border border-slate-600 focus:border-blue-500 focus:outline-none mb-3"
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 309,
                            columnNumber: 17
                        }, void 0),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-[10px] text-slate-400 font-bold mb-1 uppercase",
                            children: "並び替え"
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 311,
                            columnNumber: 17
                        }, void 0),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setClientSort('default'),
                                    className: `flex-1 py-1 text-xs rounded border ${clientSort === 'default' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-600 text-slate-400 hover:border-slate-400'}`,
                                    children: "登録順"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 313,
                                    columnNumber: 19
                                }, void 0),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setClientSort('name'),
                                    className: `flex-1 py-1 text-xs rounded border ${clientSort === 'name' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-600 text-slate-400 hover:border-slate-400'}`,
                                    children: "名前順"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 314,
                                    columnNumber: 19
                                }, void 0)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 312,
                            columnNumber: 17
                        }, void 0)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 308,
                    columnNumber: 28
                }, void 0)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 284,
            columnNumber: 12
        }, void 0),
        // ★左側ドラム：ズレを直し、余計な文字を削除
        leftDrum: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative h-full w-full flex flex-col items-center",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 w-full overflow-hidden flex justify-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$DrumRoll$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DrumRoll"], {
                        items: sortedPeriods,
                        direction: "vertical",
                        selectedId: periodId,
                        onSelect: setPeriodId
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 323,
                        columnNumber: 13
                    }, void 0)
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 322,
                    columnNumber: 11
                }, void 0),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-[#0f172a] to-transparent pointer-events-none z-10"
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 327,
                    columnNumber: 11
                }, void 0),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: handleAddPeriod,
                    className: "absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-lg border border-white/10 z-50",
                    title: "年度を追加",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-lg font-bold pb-1",
                        children: "+"
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 331,
                        columnNumber: 13
                    }, void 0)
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 330,
                    columnNumber: 11
                }, void 0)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 320,
            columnNumber: 13
        }, void 0),
        headerTitle: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between mb-1",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2",
                        children: [
                            selectedClient?.label,
                            selectedClient?.clientDriveSetting?.isConnected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex items-center gap-1 bg-green-50 text-green-600 px-1.5 py-0.5 rounded text-[9px] border border-green-100 animate-pulse",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-1.5 h-1.5 rounded-full bg-green-500"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 338,
                                        columnNumber: 19
                                    }, void 0),
                                    "Sync ON"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 337,
                                columnNumber: 67
                            }, void 0)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 335,
                        columnNumber: 13
                    }, void 0)
                }, void 0, false, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 334,
                    columnNumber: 11
                }, void 0),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-xl font-bold text-slate-800 leading-tight flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: periodId === 'perm' ? 'text-yellow-500' : 'text-blue-600',
                            children: selectedPeriod?.label
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 344,
                            columnNumber: 13
                        }, void 0),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: periodId === 'perm' ? '永久保存ドキュメント' : '確定申告・決算資料'
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 345,
                            columnNumber: 13
                        }, void 0),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setIsTemplateEditMode(!isTemplateEditMode),
                            className: `ml-4 text-xs px-3 py-1 rounded-full border transition-all ${isTemplateEditMode ? 'bg-yellow-500 text-white border-yellow-500 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-blue-400 hover:text-blue-500'}`,
                            children: isTemplateEditMode ? '完了' : '枠の設定'
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 346,
                            columnNumber: 13
                        }, void 0),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: handleResync,
                            className: "ml-2 text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors flex items-center gap-1",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                children: "🔄"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 350,
                                columnNumber: 15
                            }, void 0)
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 349,
                            columnNumber: 13
                        }, void 0)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 343,
                    columnNumber: 11
                }, void 0)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/page.tsx",
            lineNumber: 333,
            columnNumber: 30
        }, void 0),
        progress: progress,
        progressColor: periodId === 'perm' ? 'text-yellow-500' : 'text-blue-600',
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "file",
                        ref: fileInputRef,
                        className: "hidden",
                        onChange: handleFileChange,
                        accept: ".pdf,.png,.jpg,.jpeg,.xlsx,.docx"
                    }, void 0, false, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 355,
                        columnNumber: 9
                    }, this),
                    currentData.map((item_0)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            onClick: ()=>handleCardClick(item_0),
                            className: `
              relative h-40 rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer group
              ${isTemplateEditMode ? 'border-2 border-yellow-400 bg-yellow-50/20' : ''}
              ${!isTemplateEditMode && item_0.isFilled ? 'bg-white shadow-sm border-l-4 hover:shadow-lg hover:scale-105' : !isTemplateEditMode ? 'bg-slate-50 border-2 border-dashed border-slate-300 hover:bg-white hover:border-blue-400' : ''}
              ${!isTemplateEditMode && item_0.isFilled && item_0.category === 'template' ? 'border-indigo-500' : ''}
              ${!isTemplateEditMode && item_0.isFilled && item_0.category === 'custom' ? 'border-orange-400' : ''} 
            `,
                            children: [
                                isTemplateEditMode && item_0.category === 'template' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: (e_1)=>{
                                        e_1.stopPropagation();
                                        handleDeleteTemplate(item_0.title);
                                    },
                                    className: "absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 z-50 font-bold",
                                    children: "×"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 364,
                                    columnNumber: 70
                                }, this),
                                !isTemplateEditMode && item_0.isFilled && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-40",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: (e_2)=>{
                                            e_2.stopPropagation();
                                            handleUnlinkFile(item_0.title);
                                        },
                                        className: "bg-slate-100/80 hover:bg-red-50 text-slate-400 hover:text-red-500 p-1.5 rounded-lg backdrop-blur-sm border border-slate-200 transition-colors",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm",
                                            children: "🔗×"
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 372,
                                            columnNumber: 168
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 369,
                                        columnNumber: 18
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 368,
                                    columnNumber: 56
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "absolute -top-3 left-4 z-30",
                                    children: item_0.category === 'template' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full border border-white shadow-sm",
                                        children: "必須"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 375,
                                        columnNumber: 49
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "bg-orange-100 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full border border-white shadow-sm",
                                        children: "追加"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 375,
                                        columnNumber: 182
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 374,
                                    columnNumber: 13
                                }, this),
                                item_0.isFilled ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex justify-between items-start pt-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded uppercase tracking-wider",
                                                    children: "PDF"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 379,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${item_0.category === 'custom' ? 'bg-orange-400' : 'bg-green-500'}`,
                                                    children: "✓"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 380,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 378,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "font-bold text-slate-700 text-sm leading-tight line-clamp-2",
                                                    children: item_0.title
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 383,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[10px] text-slate-400 mt-1 font-mono truncate",
                                                    children: "Submitted.pdf"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/page.tsx",
                                                    lineNumber: 384,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 382,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col items-center justify-center h-full text-center pt-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "w-10 h-10 rounded-full bg-slate-200 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500 flex items-center justify-center mb-2 transition-colors",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xl font-bold",
                                                children: "+"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/page.tsx",
                                                lineNumber: 388,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 387,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "font-bold text-slate-400 text-sm group-hover:text-blue-600 transition-colors",
                                            children: isUploading && uploadTarget?.title === item_0.title ? '送信中...' : item_0.title
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/page.tsx",
                                            lineNumber: 390,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 386,
                                    columnNumber: 21
                                }, this)
                            ]
                        }, item_0.id, true, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 357,
                            columnNumber: 36
                        }, this)),
                    isTemplateEditMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        onClick: handleAddTemplate,
                        className: "h-40 rounded-2xl border-4 border-dashed border-yellow-300 flex flex-col items-center justify-center text-yellow-500 bg-yellow-50 hover:bg-yellow-100 cursor-pointer transition-all gap-2 animate-[wiggle_0.4s_ease-in-out_infinite_reverse]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-4xl font-black",
                                children: "+"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 397,
                                columnNumber: 14
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-sm font-bold",
                                children: "枠を追加"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 398,
                                columnNumber: 14
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 396,
                        columnNumber: 32
                    }, this),
                    !isTemplateEditMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        onClick: ()=>handleUploadClick('新規ファイル', 'custom'),
                        className: "h-40 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 hover:border-orange-300 hover:text-orange-400 hover:bg-orange-50/10 cursor-pointer transition-all gap-2 group",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-10 h-10 rounded-full bg-slate-100 group-hover:bg-orange-100 flex items-center justify-center transition-colors",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xl font-light",
                                    children: "+"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 403,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 402,
                                columnNumber: 14
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-bold",
                                children: "ファイルを追加"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 405,
                                columnNumber: 14
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/page.tsx",
                        lineNumber: 401,
                        columnNumber: 33
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 354,
                columnNumber: 7
            }, this),
            isUploading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black/20 z-[100] flex items-center justify-center cursor-wait",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 411,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "font-bold text-slate-700",
                            children: "Driveへ保存中..."
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 412,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 410,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 409,
                columnNumber: 23
            }, this),
            previewFile && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 md:p-10 animate-[fadeIn_0.2s_ease-out]",
                onClick: ()=>setPreviewFile(null),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-slate-900 w-full h-full max-w-6xl rounded-2xl overflow-hidden flex flex-col relative shadow-2xl",
                    onClick: (e_3)=>e_3.stopPropagation(),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "h-14 bg-slate-800 flex items-center justify-between px-6 border-b border-slate-700",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-white font-bold truncate",
                                    children: previewFile.title
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 419,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setPreviewFile(null),
                                    className: "text-slate-400 hover:text-white text-2xl font-bold leading-none",
                                    children: "×"
                                }, void 0, false, {
                                    fileName: "[project]/src/app/page.tsx",
                                    lineNumber: 420,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 418,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 bg-slate-100 relative",
                            children: previewFile.url ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("iframe", {
                                src: previewFile.url,
                                className: "w-full h-full",
                                title: "PDF Preview"
                            }, void 0, false, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 423,
                                columnNumber: 34
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col items-center justify-center h-full text-slate-400 gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-6xl",
                                        children: "🔒"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 424,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "プレビューできません"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/page.tsx",
                                        lineNumber: 425,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/page.tsx",
                                lineNumber: 423,
                                columnNumber: 115
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/app/page.tsx",
                            lineNumber: 422,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/page.tsx",
                    lineNumber: 417,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/page.tsx",
                lineNumber: 416,
                columnNumber: 23
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/page.tsx",
        lineNumber: 282,
        columnNumber: 10
    }, this);
}
_s(DocuGridPage, "in36J0fuMkm1yU+MB5F5y1877w4=");
_c = DocuGridPage;
var _c;
__turbopack_context__.k.register(_c, "DocuGridPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_93161de2._.js.map