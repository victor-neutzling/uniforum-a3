import { useState } from "react";
import { Sheet, Typography, Input, Button, Stack, Divider } from "@mui/joy";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import api from "../../api/axios";
import { useToast } from "../../shared/hooks/use-toaster";

type Mode = "login" | "register";

type User = {
  id?: number | string;
  name: string;
  email: string;
  password: string;
};

export default function LoginPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");

  const [form, setForm] = useState<User>({
    name: "",
    email: "",
    password: "",
  });

  const { showToast, ToastContainer } = useToast();

  const isRegister = mode === "register";

  const handleChange =
    (field: keyof User) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // ✅ LOGIN
  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get("/users", {
        params: {
          email: form.email.trim(),
        },
      });

      if (res.data[0].password !== form.password) {
        throw new Error("Invalid credentials");
      }

      return res.data;
    },

    onSuccess: (data) => {
      if (!data || data.length === 0) {
        showToast("Credenciais inválidas", "danger");
        return;
      }

      const user = data[0];

      // 🔥 SAVE USER TO LOCAL STORAGE
      localStorage.setItem("user", JSON.stringify(user));

      showToast(`Bem vindo de volta, ${user.name}.`, "success");

      navigate("/home");
    },

    onError: () => {
      showToast("Algo deu errado", "danger");
    },
  });

  // ✅ REGISTER
  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/users", form);
      return res.data;
    },

    onSuccess: () => {
      showToast("Conta criada! realize o login.", "success");

      setMode("login");

      setForm({
        name: "",
        email: "",
        password: "",
      });
    },

    onError: () => {
      showToast("Falha ao criar conta", "danger");
    },
  });

  const handleSubmit = () => {
    if (isRegister) {
      registerMutation.mutate();
    } else {
      loginMutation.mutate();
    }
  };

  return (
    <>
      <ToastContainer />

      <Sheet
        sx={{
          width: 360,
          mx: "auto",
          mt: 10,
          p: 4,
          borderRadius: "lg",
          boxShadow: "lg",
        }}
      >
        <Stack spacing={2}>
          <Typography level="h3" textAlign="center">
            {isRegister ? "Criar conta" : "Uniforum"}
          </Typography>

          <Divider />

          {isRegister && (
            <Input
              placeholder="Nome completo"
              value={form.name}
              onChange={handleChange("name")}
            />
          )}

          <Input
            placeholder="Email"
            value={form.email}
            onChange={handleChange("email")}
          />

          <Input
            placeholder="senha"
            type="password"
            value={form.password}
            onChange={handleChange("password")}
          />

          <Button
            loading={loginMutation.isPending || registerMutation.isPending}
            onClick={handleSubmit}
          >
            {isRegister ? "Cadastrar" : "Fazer login"}
          </Button>

          <Typography
            level="body-sm"
            sx={{
              textAlign: "center",
              cursor: "pointer",
            }}
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
    </>
  );
}
