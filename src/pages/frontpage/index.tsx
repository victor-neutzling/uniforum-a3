import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import api from "../../api/axios";

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

  const [openCommunityModal, setOpenCommunityModal] = useState(false);

  const [communityName, setCommunityName] = useState("");
  const [communityCode, setCommunityCode] = useState("");
  const [communityProfessor, setCommunityProfessor] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");

  const communityColors = [
    "#1976d2",
    "#2e7d32",
    "#ed6c02",
    "#9c27b0",
    "#d32f2f",
    "#0288d1",
    "#7b1fa2",
    "#455a64",
  ];

  const [communityColor, setCommunityColor] = useState(communityColors[0]);

  // FIXED: string consistency (CRITICAL)
  const userId = String(user?.id);

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const { data: posts = [] } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const res = await api.get("/posts");
      return res.data;
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data;
    },
  });

  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await api.get("/communities");
      return res.data;
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments"],
    queryFn: async () => {
      const res = await api.get("/comments");
      return res.data;
    },
  });

  const getCommentsCount = (postId: string) =>
    comments.filter((c: Comment) => c.postId === postId).length;

  const toggleLike = async (post: Post) => {
    if (!userId) return;

    // optimistic update (instant UI)
    queryClient.setQueryData(["posts"], (old: Post[] = []) => {
      return old.map((p) => {
        if (p.id !== post.id) return p;

        const likes = p.likes || [];
        const alreadyLiked = likes.includes(userId);

        return {
          ...p,
          likes: alreadyLiked
            ? likes.filter((id) => id !== userId)
            : [...likes, userId],
        };
      });
    });

    try {
      const currentLikes = post.likes || [];
      const alreadyLiked = currentLikes.includes(userId);

      const updatedLikes = alreadyLiked
        ? currentLikes.filter((id) => id !== userId)
        : [...currentLikes, userId];

      await api.patch(`/posts/${post.id}`, {
        likes: updatedLikes,
      });

      queryClient.invalidateQueries({ queryKey: ["posts"] });
    } catch {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    }
  };

  const createCommunity = async () => {
    if (!communityName.trim() || !communityCode.trim()) return;

    const newCommunity = {
      name: communityName,
      code: communityCode,
      professor: communityProfessor,
      description: communityDescription,
      color: communityColor,
    };

    await api.post("/communities", newCommunity);

    queryClient.invalidateQueries({
      queryKey: ["communities"],
    });

    setOpenCommunityModal(false);

    setCommunityName("");
    setCommunityCode("");
    setCommunityProfessor("");
    setCommunityDescription("");
    setCommunityColor(communityColors[0]);
  };

  return (
    <Sheet sx={{ minHeight: "100vh", bgcolor: "background.body" }}>
      {/* HEADER */}
      <Sheet
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1.5,
          boxShadow: "sm",
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.surface",
        }}
      >
        <Typography level="h4">Uniforum</Typography>

        {/* USER MENU */}
        <Dropdown>
          <MenuButton
            slots={{ root: Avatar }}
            slotProps={{
              root: { sx: { cursor: "pointer" } },
            }}
          >
            {user?.name?.charAt(0) || "U"}
          </MenuButton>

          <Menu placement="bottom-end">
            <MenuItem disabled>
              Logado como <b>{user?.name || "User"}</b>
            </MenuItem>
            <MenuItem onClick={() => setOpenCommunityModal(true)}>
              Criar comunidade (temp)
            </MenuItem>

            <MenuItem color="danger" onClick={logout}>
              Sair
            </MenuItem>
          </Menu>
        </Dropdown>
      </Sheet>

      {/* MAIN LAYOUT */}
      <Stack
        direction="row"
        spacing={2}
        sx={{
          maxWidth: 1200,
          mx: "auto",
          px: 2,
          py: 3,
        }}
      >
        {/* FEED */}
        <Stack spacing={2} sx={{ flex: 1 }}>
          {[...posts].reverse().map((post: Post) => (
            <Card key={post.id}>
              <CardContent>
                {/* CLICKABLE CONTENT */}
                <div
                  onClick={() => navigate(`/post/${post.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Typography sx={{ fontWeight: "bold", fontSize: "24px" }}>
                      {post.title}
                    </Typography>

                    <Typography
                      level="body-sm"
                      sx={{
                        color: "text.secondary",
                        whiteSpace: "nowrap",
                      }}
                    >
                      criado por{" "}
                      {users.find(
                        (u: any) => String(u.id) === String(post.userId),
                      )?.name || "Unknown"}
                      {" @ "}
                      <Typography
                        component="span"
                        sx={{
                          fontWeight: "bold",
                        }}
                      >
                        {communities.find(
                          (c: Community) =>
                            String(c.id) === String(post.communityId),
                        )?.name || "Unknown Community"}
                      </Typography>
                    </Typography>
                  </Box>

                  <Typography level="body-sm" sx={{ mt: 1 }}>
                    {post.content}
                  </Typography>

                  {post.type === "image" && post.image && (
                    <AspectRatio ratio="16/9" sx={{ mt: 2 }}>
                      <img src={post.image} alt={post.title} />
                    </AspectRatio>
                  )}
                </div>

                {/* FOOTER */}
                <Stack
                  direction="row"
                  spacing={2}
                  sx={{
                    mt: 2,
                    pt: 1,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    opacity: 0.8,
                    alignItems: "center",
                  }}
                >
                  {/* LIKE */}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton
                      size="sm"
                      variant={post.likes?.includes(userId) ? "soft" : "plain"}
                      color={
                        post.likes?.includes(userId) ? "primary" : "neutral"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(post);
                      }}
                    >
                      {post.likes?.includes(userId) ? (
                        <ThumbUpIcon />
                      ) : (
                        <ThumbUpOutlinedIcon />
                      )}
                    </IconButton>

                    <Typography level="body-sm">
                      {post.likes?.length || 0}
                    </Typography>
                  </Stack>

                  {/* COMMENTS */}
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <IconButton
                      size="sm"
                      variant="plain"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/post/${post.id}`);
                      }}
                    >
                      <ChatBubbleOutlineIcon />
                    </IconButton>

                    <Typography level="body-sm">
                      {getCommentsCount(post.id)}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
          <Box
            sx={{ display: "flex", width: "100%", justifyContent: "center" }}
          >
            <Typography sx={{ color: "#717171" }}>Você já viu tudo.</Typography>
          </Box>
        </Stack>

        {/* RIGHT SIDEBAR */}
        <Sheet
          sx={{
            width: 280,
            p: 2,
            borderRadius: "md",
            boxShadow: "sm",
            height: "fit-content",
            position: "sticky",
            top: 80,
          }}
        >
          <Typography level="title-md" mb={1}>
            Comunidades
          </Typography>

          <Divider />

          <Stack spacing={1} mt={1}>
            {communities.map((c: Community) => (
              <Sheet
                key={c.id}
                sx={{
                  p: 1,
                  borderRadius: "sm",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "neutral.softBg" },
                }}
                onClick={() => navigate(`/community/${c.id}`)}
              >
                <Typography level="body-sm">{c.name}</Typography>
                <Typography level="body-xs" sx={{ opacity: 0.6 }}>
                  {c.code}
                </Typography>
              </Sheet>
            ))}
          </Stack>
        </Sheet>
      </Stack>
      <Modal
        open={openCommunityModal}
        onClose={() => setOpenCommunityModal(false)}
      >
        <ModalDialog
          sx={{
            width: 600,
            maxWidth: "95vw",
          }}
        >
          <Typography level="h4">Criar comunidade</Typography>

          <Stack spacing={2} mt={1}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                value={communityName}
                onChange={(e) => setCommunityName(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Código</FormLabel>
              <Input
                placeholder="CS101"
                value={communityCode}
                onChange={(e) => setCommunityCode(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Professor</FormLabel>
              <Input
                value={communityProfessor}
                onChange={(e) => setCommunityProfessor(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Descrição</FormLabel>
              <Textarea
                minRows={3}
                value={communityDescription}
                onChange={(e) => setCommunityDescription(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Tema</FormLabel>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                {communityColors.map((color) => (
                  <Box
                    key={color}
                    onClick={() => setCommunityColor(color)}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: color,
                      cursor: "pointer",
                      border:
                        communityColor === color ? "3px solid white" : "none",
                      boxShadow:
                        communityColor === color ? "0 0 0 2px black" : "sm",
                    }}
                  />
                ))}
              </Stack>
            </FormControl>

            <Button onClick={createCommunity}>Criar comunidade</Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Sheet>
  );
}
