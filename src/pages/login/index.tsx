import { useState } from "react";
import { Sheet, Typography, Input, Button, Stack, FormLabel, Divider } from "@mui/joy";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import api from "../../api/axios";
import { useToast } from "../../shared/hooks/use-toaster";
import logo from "../../assets/logouniforum.png";

type Mode = "login" | "register";

type User = {
  id?: number | string;
  name: string;
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [mode, setMode] = useState<Mode>("login");
  const [form, setForm] = useState<User>({ name: "", email: "", password: "" });

  const isRegister = mode === "register";

  const handleChange =
    (field: keyof User) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get("/users", {
        params: { email: form.email.trim() },
      });

      if (!res.data || res.data.length === 0) {
        throw new Error("Usuário não encontrado");
      }

      if (res.data[0].password !== form.password) {
        throw new Error("Senha incorreta");
      }

      return res.data;
    },
    onSuccess: (data) => {
      const user = data[0];
      localStorage.setItem("user", JSON.stringify(user));
      showToast(`Bem vindo de volta, ${user.name}.`, "success");
      navigate("/home");
    },
    onError: () => {
      showToast("Credenciais inválidas", "danger");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/users", form);
      return res.data;
    },
    onSuccess: () => {
      showToast("Conta criada! Realize o login.", "success");
      setMode("login");
      setForm({ name: "", email: "", password: "" });
    },
    onError: () => {
      showToast("Falha ao criar conta", "danger");
    },
  });

  const handleSubmit = () => {
    if (isRegister) registerMutation.mutate();
    else loginMutation.mutate();
  };

  return (
    <>
      <ToastContainer />

      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f0f2f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Sheet
          sx={{
            width: 420,
            p: 5,
            borderRadius: "xl",
            boxShadow: "lg",
            backgroundColor: "#fff",
          }}
        >
          <Stack spacing={3} alignItems="center">

            {/* Logo */}
          <img
            src={logo} 
            alt="Uniforum logo"
            style={{ width: 64, height: 64, objectFit: "contain" }}
          />

            {/* Nome */}
            <Typography
              level="h2"
              sx={{
                fontWeight: 800,
                letterSpacing: 1,
                "& span": { color: "#0d9488" },
              }}
            >
              UNI<span>FORUM</span>
            </Typography>

            {/* Subtítulo */}
            <Stack spacing={0.5} alignItems="center">
              <Typography level="h4" fontWeight={700}>
                {isRegister ? "Crie sua conta" : "Seja Bem-vindo!"}
              </Typography>
              <Typography level="body-sm" textColor="neutral.500">
                {isRegister
                  ? "Preencha os dados abaixo"
                  : "Acesse sua conta para continuar"}
              </Typography>
            </Stack>

            <Divider sx={{ width: "100%" }} />

            {/* Campos */}
            <Stack spacing={2} sx={{ width: "100%" }}>

              {isRegister && (
                <Stack spacing={0.5}>
                  <FormLabel>Nome</FormLabel>
                  <Input
                    placeholder="Seu nome completo"
                    value={form.name}
                    onChange={handleChange("name")}
                    sx={{ borderRadius: "md" }}
                  />
                </Stack>
              )}

              <Stack spacing={0.5}>
                <FormLabel>Email</FormLabel>
                <Input
                  placeholder="ra@ulife.com.br"
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  sx={{ borderRadius: "md" }}
                />
              </Stack>

              <Stack spacing={0.5}>
                <FormLabel>Senha</FormLabel>
                <Input
                  placeholder="••••••••"
                  type="password"
                  value={form.password}
                  onChange={handleChange("password")}
                  sx={{ borderRadius: "md" }}
                />
              </Stack>

            </Stack>

            {/* Botão */}
            <Button
              fullWidth
              loading={loginMutation.isPending || registerMutation.isPending}
              onClick={handleSubmit}
              sx={{
                backgroundColor: "#0d9488",
                "&:hover": { backgroundColor: "#0f766e" },
                borderRadius: "md",
                fontWeight: 600,
                fontSize: "1rem",
                py: 1.5,
              }}
            >
              {isRegister ? "Cadastrar" : "Fazer login"}
            </Button>

            {/* Alternar modo */}
            <Typography
              level="body-sm"
              sx={{ cursor: "pointer", color: "#0d9488", fontWeight: 500 }}
              onClick={() =>
                setMode((prev) => (prev === "login" ? "register" : "login"))
              }
            >
              {isRegister
                ? "Já possui uma conta? Login"
                : "Não tem uma conta? Cadastrar"}
            </Typography>

          </Stack>
        </Sheet>
      </div>
    </>
  );
}