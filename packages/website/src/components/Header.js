import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
export function Header() {
    return (_jsx("header", { className: "border-b border-gray-200 bg-white", children: _jsxs("nav", { className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between", children: [_jsx(Link, { to: "/", className: "text-xl font-bold text-gray-900", children: "Paget" }), _jsxs("div", { className: "flex items-center gap-6", children: [_jsx(Link, { to: "/", className: "text-sm text-gray-600 hover:text-gray-900", children: "\u9996\u9875" }), _jsx(Link, { to: "/demo", className: "text-sm text-gray-600 hover:text-gray-900", children: "\u6F14\u793A" }), _jsx("a", { href: "https://github.com", target: "_blank", rel: "noopener noreferrer", className: "text-sm text-gray-600 hover:text-gray-900", children: "GitHub" })] })] }) }));
}
