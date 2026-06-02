import { CssVarsProvider, extendTheme } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import Router from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const theme = extendTheme({
  fontFamily: {
    body: "'Montserrat', sans-serif",
    display: "'Montserrat', sans-serif",
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CssVarsProvider defaultMode="light" theme={theme}> {}
        <CssBaseline />
        <Router />
      </CssVarsProvider>
    </QueryClientProvider>
  );
}