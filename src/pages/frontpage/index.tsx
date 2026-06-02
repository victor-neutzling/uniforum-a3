import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import api from "../../api/axios";
import logo from "../../assets/logouniforum.png";

import {
  Sheet,
  Typography,
  Stack,
  Card,
  CardContent,
  AspectRatio,
  Divider,
  Avatar,
  IconButton,
  Box,
  Modal,
  ModalDialog,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
} from "@mui/joy";

import Dropdown from "@mui/joy/Dropdown";
import Menu from "@mui/joy/Menu";
import MenuButton from "@mui/joy/MenuButton";
import MenuItem from "@mui/joy/MenuItem";

import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutlined";
import { Search, Bell, Plus } from "lucide-react";
import { useState } from "react";

type Post = {
  id: string;
  title: string;
  content: string;
  image?: string | null;
  type: "text" | "image";
  likes?: string[];
  communityId: string;
  userId: string;
};

type Community = {
  id: string;
  name: string;
  code: string;
  color?: string;
};

type Comment = {
  id: string;
  postId: string;
  content: string;
};

export default function FrontPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = String(user?.id);
  const initials = user?.name?.charAt(0).toUpperCase() ?? "U";

  const [openCommunityModal, setOpenCommunityModal] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [communityCode, setCommunityCode] = useState("");
  const [communityProfessor, setCommunityProfessor] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [search, setSearch] = useState("");

  const communityColors = [
    "#1976d2", "#2e7d32", "#ed6c02", "#9c27b0",
    "#d32f2f", "#0288d1", "#7b1fa2", "#455a64",
  ];
  const [communityColor, setCommunityColor] = useState(communityColors[0]);

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const { data: posts = [] } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => (await api.get("/posts")).data,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/users")).data,
  });

  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => (await api.get("/communities")).data,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments"],
    queryFn: async () => (await api.get("/comments")).data,
  });

  const getCommentsCount = (postId: string) =>
    comments.filter((c: Comment) => c.postId === postId).length;

  const getCommunity = (id: string) =>
    communities.find((c: Community) => String(c.id) === String(id));

  const getAuthor = (id: string) =>
    users.find((u: any) => String(u.id) === String(id));

  const filteredPosts = [...posts]
    .reverse()
    .filter((p: Post) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase())
    );

  const toggleLike = async (post: Post) => {
    if (!userId) return;
    queryClient.setQueryData(["posts"], (old: Post[] = []) =>
      old.map((p) => {
        if (p.id !== post.id) return p;
        const likes = p.likes || [];
        const alreadyLiked = likes.includes(userId);
        return {
          ...p,
          likes: alreadyLiked
            ? likes.filter((id) => id !== userId)
            : [...likes, userId],
        };
      })
    );
    try {
      const currentLikes = post.likes || [];
      const alreadyLiked = currentLikes.includes(userId);
      await api.patch(`/posts/${post.id}`, {
        likes: alreadyLiked
          ? currentLikes.filter((id) => id !== userId)
          : [...currentLikes, userId],
      });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    }
  };

  const createCommunity = async () => {
    if (!communityName.trim() || !communityCode.trim()) return;
    await api.post("/communities", {
      name: communityName,
      code: communityCode,
      professor: communityProfessor,
      description: communityDescription,
      color: communityColor,
    });
    queryClient.invalidateQueries({ queryKey: ["communities"] });
    setOpenCommunityModal(false);
    setCommunityName("");
    setCommunityCode("");
    setCommunityProfessor("");
    setCommunityDescription("");
    setCommunityColor(communityColors[0]);
  };

  return (
    <Sheet sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>

      {/* ── HEADER ── */}
      <Sheet
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 1.5,
          boxShadow: "sm",
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "#fff",
          gap: 2,
        }}
      >
        {/* Logo */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ cursor: "pointer", flexShrink: 0 }}
          onClick={() => navigate("/home")}
        >
          <img
            src={logo}
            alt="logo"
            style={{ width: 36, height: 36, objectFit: "contain" }}
          />
          <Typography
            level="h4"
            sx={{ fontWeight: 800, letterSpacing: 1, "& span": { color: "#0d9488" } }}
          >
            UNI<span>FORUM</span>
          </Typography>
        </Stack>

        {/* Busca */}
        <Input
          placeholder="Buscar posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startDecorator={<Search size={16} />}
          sx={{ flex: 1, maxWidth: 480, borderRadius: "xl", bgcolor: "#f0f2f5", border: "none" }}
        />

        {/* Ações */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton variant="plain" color="neutral">
            <Bell size={20} />
          </IconButton>

          <Dropdown>
            <MenuButton
              slots={{ root: Avatar }}
              slotProps={{
                root: {
                  sx: { cursor: "pointer", bgcolor: "#0d9488", color: "#fff", fontWeight: 700 },
                },
              }}
            >
              {initials}
            </MenuButton>
            <Menu placement="bottom-end">
              <MenuItem disabled>
                Olá,&nbsp;<b>{user?.name || "User"}</b>
              </MenuItem>
              <MenuItem onClick={() => setOpenCommunityModal(true)}>
                Criar comunidade
              </MenuItem>
              <MenuItem color="danger" onClick={logout}>
                Sair
              </MenuItem>
            </Menu>
          </Dropdown>
        </Stack>
      </Sheet>

      {/* ── MAIN ── */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ maxWidth: 1200, mx: "auto", px: 2, py: 3 }}
      >
        {/* FEED */}
        <Stack spacing={2} sx={{ flex: 1 }}>

          {/* Botão criar post */}
          <Button
            startDecorator={<Plus size={16} />}
            onClick={() => navigate("/post/new")}
            sx={{
              bgcolor: "#0d9488",
              "&:hover": { bgcolor: "#0f766e" },
              borderRadius: "md",
              fontWeight: 600,
            }}
          >
            Criar post
          </Button>

          {filteredPosts.map((post: Post) => {
            const community = getCommunity(post.communityId);
            const author = getAuthor(post.userId);
            const liked = post.likes?.includes(userId);

            return (
              <Card
                key={post.id}
                sx={{
                  borderRadius: "lg",
                  boxShadow: "sm",
                  transition: "box-shadow 0.2s",
                  "&:hover": { boxShadow: "md" },
                }}
              >
                <CardContent>

                  {/* Autor + comunidade */}
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <Avatar
                      size="sm"
                      sx={{
                        bgcolor: community?.color || "#0d9488",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {community?.name?.charAt(0) || "?"}
                    </Avatar>
                    <Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography
                          level="body-xs"
                          fontWeight={700}
                          sx={{
                            cursor: "pointer",
                            color: community?.color || "#0d9488",
                            "&:hover": { textDecoration: "underline" },
                          }}
                          onClick={() => navigate(`/community/${post.communityId}`)}
                        >
                          {community?.name || "Comunidade"}
                        </Typography>
                        <Typography level="body-xs" textColor="neutral.400">
                          · {community?.code}
                        </Typography>
                      </Stack>
                      <Typography level="body-xs" textColor="neutral.500">
                        por {author?.name || "Desconhecido"}
                      </Typography>
                    </Stack>
                  </Stack>

                  {/* Conteúdo clicável */}
                  <div
                    onClick={() => navigate(`/post/${post.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <Typography fontWeight={700} fontSize={18} mb={0.5}>
                      {post.title}
                    </Typography>

                    <Typography
                      level="body-sm"
                      textColor="neutral.600"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {post.content}
                    </Typography>

                    {post.type === "image" && post.image && (
                      <AspectRatio ratio="16/9" sx={{ mt: 1.5, borderRadius: "md", overflow: "hidden" }}>
                        <img src={post.image} alt={post.title} />
                      </AspectRatio>
                    )}
                  </div>

                  {/* Footer */}
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ mt: 1.5, pt: 1, borderTop: "1px solid", borderColor: "divider" }}
                  >
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconButton
                        size="sm"
                        variant={liked ? "soft" : "plain"}
                        color={liked ? "primary" : "neutral"}
                        onClick={(e) => { e.stopPropagation(); toggleLike(post); }}
                      >
                        {liked ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                      </IconButton>
                      <Typography level="body-sm">{post.likes?.length || 0}</Typography>
                    </Stack>

                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <IconButton
                        size="sm"
                        variant="plain"
                        onClick={(e) => { e.stopPropagation(); navigate(`/post/${post.id}`); }}
                      >
                        <ChatBubbleOutlineIcon />
                      </IconButton>
                      <Typography level="body-sm">{getCommentsCount(post.id)}</Typography>
                    </Stack>
                  </Stack>

                </CardContent>
              </Card>
            );
          })}

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Typography sx={{ color: "#717171" }}>Você já viu tudo.</Typography>
          </Box>
        </Stack>

        {/* SIDEBAR DIREITA */}
        <Sheet
          sx={{
            width: 280,
            p: 2,
            borderRadius: "lg",
            boxShadow: "sm",
            height: "fit-content",
            position: "sticky",
            top: 80,
            bgcolor: "#fff",
          }}
        >
          <Typography level="title-md" mb={1} fontWeight={700}>
            Comunidades
          </Typography>
          <Divider />
          <Stack spacing={0.5} mt={1}>
            {communities.map((c: Community) => (
              <Sheet
                key={c.id}
                sx={{
                  p: 1.5,
                  borderRadius: "md",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  "&:hover": { bgcolor: "neutral.softBg" },
                }}
                onClick={() => navigate(`/community/${c.id}`)}
              >
                <Avatar
                  size="sm"
                  sx={{ bgcolor: c.color || "#0d9488", color: "#fff", fontWeight: 700, fontSize: 12 }}
                >
                  {c.name?.charAt(0)}
                </Avatar>
                <Stack spacing={0}>
                  <Typography level="body-sm" fontWeight={600}>{c.name}</Typography>
                  <Typography level="body-xs" textColor="neutral.400">{c.code}</Typography>
                </Stack>
              </Sheet>
            ))}
          </Stack>

          <Button
            fullWidth
            variant="outlined"
            startDecorator={<Plus size={14} />}
            onClick={() => setOpenCommunityModal(true)}
            sx={{
              mt: 2,
              borderColor: "#0d9488",
              color: "#0d9488",
              "&:hover": { bgcolor: "#f0fdfa" },
            }}
          >
            Nova comunidade
          </Button>
        </Sheet>
      </Stack>

      {/* MODAL */}
      <Modal open={openCommunityModal} onClose={() => setOpenCommunityModal(false)}>
        <ModalDialog sx={{ width: 600, maxWidth: "95vw" }}>
          <Typography level="h4">Criar comunidade</Typography>
          <Stack spacing={2} mt={1}>
            <FormControl>
              <FormLabel>Nome</FormLabel>
              <Input value={communityName} onChange={(e) => setCommunityName(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Código</FormLabel>
              <Input placeholder="CS101" value={communityCode} onChange={(e) => setCommunityCode(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Professor</FormLabel>
              <Input value={communityProfessor} onChange={(e) => setCommunityProfessor(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Descrição</FormLabel>
              <Textarea minRows={3} value={communityDescription} onChange={(e) => setCommunityDescription(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Cor da comunidade</FormLabel>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {communityColors.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setCommunityColor(color)}
                    sx={{
                      width: 32, height: 32, borderRadius: "50%", bgcolor: color,
                      cursor: "pointer",
                      border: communityColor === color ? "3px solid white" : "none",
                      boxShadow: communityColor === color ? "0 0 0 2px black" : "sm",
                    }}
                  />
                ))}
              </Stack>
            </FormControl>
            <Button
              onClick={createCommunity}
              sx={{ bgcolor: "#0d9488", "&:hover": { bgcolor: "#0f766e" } }}
            >
              Criar comunidade
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>

    </Sheet>
  );
}