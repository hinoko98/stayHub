import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import "./styles.css";
import "./internal/internal.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

const theme = createTheme({
  typography: {
    fontFamily: '"Inter Variable", sans-serif',
  },
  palette: {
    primary: {
      main: "#003b95",
    },
    secondary: {
      main: "#febb02",
    },
    background: {
      default: "#f5f7fb",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 18,
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
