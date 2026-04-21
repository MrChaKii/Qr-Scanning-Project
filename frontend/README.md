# React + Vite

## Zebra (IRD) scanner + camera QR scanning

This frontend supports **both**:
- Camera scanning (via `html5-qrcode`)
- Zebra built-in IRD scanners when configured as a **keyboard wedge** (DataWedge types the decoded value + Enter/Tab)

### Zebra DataWedge settings (recommended)

1. Create a DataWedge profile for the browser you use on the Zebra device (e.g. Chrome or Zebra Enterprise Browser).
2. Enable **Barcode input**.
3. Enable **Keystroke output**.
4. Set a suffix to finish each scan (either enable **Send ENTER key** or use an Enter/Tab suffix).

Once configured, scans from the IRD trigger the same behavior as camera scans in the app.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
