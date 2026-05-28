const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("token");
  } catch (_) {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (networkErr) {
    // Network error (connection refused, timeout, DNS failure, CORS block).
    // Do NOT clear auth state — the server is just temporarily unreachable.
    console.warn(`[api] Network error on ${path}:`, networkErr);
    throw new Error(`Network error: ${(networkErr as Error).message}`);
  }

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const err = await res.json();
      message = err.message || message;
    } catch (_) {}
    throw new Error(message);
  }

  const text = await res.text();
  
  if (!text || !text.trim()) {
    return null as T;
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(`[api] Failed to parse JSON response from ${path}:`, {
      status: res.status,
      text: text.slice(0, 200),
      error: err
    });
    return ({} as T);
  }
}

async function uploadRequest<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (networkErr) {
    console.warn(`[api] Network error on upload ${path}:`, networkErr);
    throw new Error(`Network error: ${(networkErr as Error).message}`);
  }

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const err = await res.json();
      message = err.message || message;
    } catch (_) {}
    throw new Error(message);
  }

  const text = await res.text();
  if (!text || !text.trim()) {
    return ({} as T);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error(`[api] Failed to parse JSON response (upload) from ${path}:`, {
      status: res.status,
      text: text.slice(0, 200),
      error: err
    });
    return ({} as T);
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (nome: string, email: string, password: string, confirm_password?: string) =>
    request<{ access_token: string; user: User }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ nome, email, password, confirm_password }),
    }),

  me: () => request<User>("/api/auth/me"),

  updateProfile: (data: { nome?: string; email?: string }) =>
    request<User>("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updatePassword: (currentPassword: string, newPassword: string) =>
    request<void>("/api/auth/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ─── Projects ──────────────────────────────────────────────────────────────
export const projectsApi = {
  list: () => request<Project[]>("/api/projects"),
  get: (id: string) => request<Project>(`/api/projects/${id}`),
  create: (data: { title: string; description?: string }) =>
    request<Project>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Project>) =>
    request<Project>(`/api/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<void>(`/api/projects/${id}`, { method: "DELETE" }),
};

// ─── Videos ────────────────────────────────────────────────────────────────
export const videosApi = {
  list: (projectId?: string) =>
    request<Video[]>(
      `/api/videos${projectId ? `?projectId=${projectId}` : ""}`,
    ),
  get: (id: string) => request<Video>(`/api/videos/${id}`),
  jobStatus: (id: string) => request<JobStatus>(`/api/videos/${id}/job-status`),
  upload: (projectId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("projectId", projectId);
    return uploadRequest<Video>("/api/videos/upload", fd);
  },
  importYoutube: (projectId: string, url: string, preferences?: object) =>
    request<Video>("/api/videos/import-youtube", {
      method: "POST",
      body: JSON.stringify({ projectId, url, preferences }),
    }),
  startProcessing: (id: string, preferences?: object) =>
    request<Video>(`/api/videos/${id}/start-processing`, {
      method: "POST",
      body: JSON.stringify(preferences || {}),
    }),
  delete: (id: string) =>
    request<void>(`/api/videos/${id}`, { method: "DELETE" }),
  getYoutubeMetadata: (url: string) =>
    request<any>(`/api/videos/youtube-metadata?url=${encodeURIComponent(url)}`),
};

// ─── Clips ─────────────────────────────────────────────────────────────────
export const clipsApi = {
  list: (videoId?: string) =>
    request<Clip[]>(`/api/clips${videoId ? `?videoId=${videoId}` : ""}`),

  get: (id: string) => request<Clip>(`/api/clips/${id}`),

  createFromAnalysis: (videoId: string) =>
    request<Clip[]>(`/api/clips/from-analysis/${videoId}`, { method: "POST" }),

  export: (id: string, options?: object) =>
    request<Clip>(`/api/clips/${id}/export`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    }),

  /**
   * Atualiza APENAS metadados do clipe (nome, thumbnail, legenda visual).
   * NÃO reprocessa o vídeo — sem FFmpeg, sem IA, sem transcrição.
   */
  updateMetadata: (
    id: string,
    data: {
      title?: string;
      thumbnail_base64?: string;
      font_family?: string | null;
      subtitle_preset?: string;
      font_color?: string | null;
      highlight_color?: string | null;
      outline_color?: string | null;
      outline_width?: number;
      animation?: string;
      font_size?: number;
      posY?: number;
      posX?: number;
      rotation?: number;
      max_words?: number;
      background_blur?: number;
      background_zoom?: number;
      subtitle_blur?: number;
      shadow_depth?: number;
      words?: { text: string; start: number; end: number }[];
      tempo_inicio?: number;
      tempo_fim?: number;
      videoTransform?: { x: number; y: number; scale: number };
      layout?: string;
      secondary_video_path?: string | null;
      subtitle_opacity?: number;
      video_opacity?: number;
    },
  ) =>
    request<Clip>(`/api/clips/${id}/metadata`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  /**
   * @deprecated Use updateMetadata() para edições visuais.
   * Este método ainda existe para compatibilidade mas não deve ser chamado
   * com campos que exijam reprocessamento (aspect_ratio, burn_subtitles, etc.)
   */
  update: (id: string, data: Partial<Clip>) =>
    request<Clip>(`/api/clips/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/clips/${id}`, { method: "DELETE" }),

  bulkExport: (videoId: string, options?: object) =>
    request<{ success: true; message: string }>(`/api/clips/bulk-export/${videoId}`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    }),
};

// ─── YouTube ───────────────────────────────────────────────────────────────
export const youtubeApi = {
  status: () => request<YoutubeAccount | null>("/api/youtube/status"),
  updateStatus: (data: { nome_canal: string }) =>
    request<YoutubeAccount>("/api/youtube/status", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getAuthUrl: () => `${API_URL}/api/youtube/auth`,
  disconnect: () =>
    request<void>("/api/youtube/disconnect", { method: "DELETE" }),
  upload: (data: {
    filePath: string;
    title: string;
    description: string;
    privacyStatus: "public" | "private" | "unlisted";
    clipId?: string;
  }) =>
    request<void>("/api/youtube/upload", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Subtitles ─────────────────────────────────────────────────────────────
export const subtitlesApi = {
  list: (videoId: string) =>
    request<Subtitle[]>(`/api/subtitles?videoId=${videoId}`),
  generate: (videoId: string, options?: object) =>
    request<Subtitle>(`/api/subtitles/generate/${videoId}`, {
      method: "POST",
      body: JSON.stringify(options || {}),
    }),
  updateStyle: (id: string, style: object) =>
    request<Subtitle>(`/api/subtitles/${id}/style`, {
      method: "PUT",
      body: JSON.stringify(style),
    }),
  delete: (id: string) =>
    request<void>(`/api/subtitles/${id}`, { method: "DELETE" }),
};

// ─── Types ─────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  nome: string;
  email: string;
  creditos_disponiveis?: number;
  plano?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
}

export interface Video {
  id: string;
  title: string;
  source_type: "upload" | "youtube";
  source_url?: string;
  youtube_thumbnail?: string;
  thumbnail_path?: string;
  file_path?: string;
  duration?: number;
  transcript_status?: string;
  analysis_status?: string;
  status?: string;
  clips?: Clip[];
  transcript_words?: any[];
  transcript_text?: string;
  created_at?: string;
  views?: number;
  likes?: number;
  comments?: number;
  creator?: string;
}

export interface Clip {
  id: string;
  video_id: string;
  title: string;
  start_time: number;
  end_time: number;
  duration?: number;
  viral_score?: number;
  score?: number;
  justification?: string;
  status?: string;
  aspect_ratio?: string;
  file_path?: string;
  output_path?: string;
  thumbnail_path?: string;
  dados_legenda?: any;
  posX?: number;
  posY?: number;
  rotation?: number;
  created_at?: string;
}

export interface Subtitle {
  id: string;
  name?: string;
  format?: string;
  language?: string;
  content?: string;
  file_url?: string;
  style?: object;
}

export interface YoutubeAccount {
  id: string;
  nome_canal?: string;
  id_canal?: string;
  miniatura_canal?: string;
  criado_em?: string;
}

export interface JobStatus {
  status: string;
  progress?: number;
  message?: string;
}

// ── Billing API ─────────────────────────────────────────────────────────────
export const billingApi = {
  checkout: (planId: string) =>
    request<{ url: string }>("/api/billing/checkout", {
      method: "POST",
      body: JSON.stringify({ planId }),
    }),
  getSubscription: () =>
    request<any>("/api/billing/subscription"),
  cancelSubscription: () =>
    request<{ success: boolean }>("/api/billing/subscription/cancel", {
      method: "POST",
    }),
  confirmSimulatedPayment: (planId: string, paymentData: any) =>
    request<{ success: boolean }>("/api/billing/checkout/confirm-simulated", {
      method: "POST",
      body: JSON.stringify({ planId, paymentData }),
    }),
};

// ── Credits API ────────────────────────────────────────────────────────────
export const creditsApi = {
  getBalance: (): Promise<{ credits: number }> =>
    request('/api/credits/balance'),
};
