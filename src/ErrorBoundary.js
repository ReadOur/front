import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
export class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = { error: null };
    }
    static getDerivedStateFromError(error) { return { error }; }
    render() {
        if (this.state.error) {
            return (_jsxs("div", { style: { padding: 16, color: "crimson", fontFamily: "monospace" }, children: [_jsx("h2", { children: "Component crashed" }), _jsx("pre", { children: String(this.state.error?.message || this.state.error) })] }));
        }
        return this.props.children;
    }
}
