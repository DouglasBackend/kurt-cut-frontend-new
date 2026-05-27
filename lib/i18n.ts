export type Language = "en" | "pt";
// TS Refresh

export const dictionaries = {
  en: {
    // Nav
    "nav.howItWorks": "How it works",
    "nav.features": "Features",
    "nav.pricing": "Pricing",
    "nav.signIn": "Sign in",
    "nav.getStarted": "Get Started",
    // Hero
    "hero.title1": "Turn long videos into viral shorts in ",
    "hero.title2": "seconds.",
    "hero.subtitle":
      "Our AI automatically finds the most engaging moments, adds dynamic captions, and formats your video for TikTok, YouTube Shorts, and Instagram Reels.",
    "hero.startFree": "Start for free",
    "hero.watchDemo": "Watch demo",
    "hero.preview": "Video Preview",
    "hero.autoCaptions": "AUTO CAPTIONS",
    // How it works
    "how.title": "How it works",
    "how.subtitle":
      "Three simple steps to transform your long-form content into viral shorts.",
    "how.step1.title": "Upload your video",
    "how.step1.desc":
      "Paste a YouTube link or upload your MP4 file directly to our platform.",
    "how.step2.title": "AI analyzes content",
    "how.step2.desc":
      "Our AI scans the video for hooks, engaging moments, and creates perfect clips.",
    "how.step3.title": "Review and export",
    "how.step3.desc":
      "Tweak captions, adjust framing, and export your viral-ready shorts.",
    // Features
    "feat.badge": "Create faster",
    "feat.title": "Everything you need to go viral",
    "feat.subtitle":
      "Stop spending hours editing. Let our AI do the heavy lifting while you focus on creating great content.",
    "feat.1.title": "AI-Powered Clipping",
    "feat.1.desc":
      "Our advanced AI analyzes your video to find the most engaging and viral moments automatically.",
    "feat.2.title": "Dynamic Captions",
    "feat.2.desc":
      "Add highly engaging, animated captions with one click. Customize fonts, colors, and styles.",
    "feat.4.title": "Auto-Publishing",
    "feat.4.desc":
      "Connect your accounts and publish directly to YouTube, TikTok, and Instagram.",
    // Pricing
    "price.title": "Simple, transparent pricing",
    "price.subtitle":
      "Choose the perfect plan for your content creation needs.",
    "price.free.title": "Start",
    "price.free.desc": "Includes 150 credits per month",
    "price.free.btn": "Choose Start",
    "price.free.price": "R$ 19,90",
    "price.pro.title": "Pro",
    "price.pro.desc": "Includes 300 credits per month",
    "price.pro.btn": "Upgrade to Pro",
    "price.pro.price": "R$ 39,90",
    "price.ult.title": "Consult",
    "price.ult.desc": "Custom volume and dedicated support",
    "price.ult.btn": "Contact Sales",
    "price.ult.price": "Consult",
    "price.mo": "/month",
    "price.popular": "Most Popular",
    // Footer
    "footer.rights": "© 2026 Kurt Cut. All rights reserved.",
    "footer.terms": "Terms",
    "footer.privacy": "Privacy",

    // Auth
    "auth.login.title": "Welcome back",
    "auth.login.desc":
      "Enter your email and password to sign in to your account",
    "auth.login.email": "Email",
    "auth.login.password": "Password",
    "auth.login.forgot": "Forgot password?",
    "auth.login.submit": "Sign In",
    "auth.login.noAccount": "Don't have an account?",
    "auth.login.signup": "Sign up",

    "auth.register.title": "Create an account",
    "auth.register.desc": "Enter your details below to create your account",
    "auth.register.name": "Full Name",
    "auth.register.confirmPassword": "Confirm Password",
    "auth.register.submit": "Create Account",
    "auth.register.hasAccount": "Already have an account?",

    // Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.upload": "Upload",
    "sidebar.editor": "Editor",
    "sidebar.clips": "Clips",
    "sidebar.integrations": "Integrations",
    "sidebar.upgrade": "Upgrade",
    "sidebar.settings": "Settings",
    "sidebar.logout": "Logout",

    // Topbar
    "topbar.search": "Search clips, videos...",
    "topbar.credits": "Credits:",

    // Dashboard
    "dash.title": "Dashboard",
    "dash.subtitle": "Overview of your video processing and clip performance.",
    "dash.metric.videos": "Videos Uploaded",
    "dash.metric.shorts": "Shorts Created",
    "dash.metric.time": "Time Processed",
    "dash.metric.views": "Total Views",
    "dash.chart.title": "Performance Overview",
    "dash.topClips.title": "Top Performing Clips",
    "dash.metric.topViews": "Top Views",
    "dash.metric.topLikes": "Top Likes",
    "dash.metric.trending": "Trending Clips",
    "dash.metric.low": "Low Performing",
    "dash.recentVideos.title": "Recent Videos",
    "dash.video.status.processing": "Processing...",
    "dash.video.status.completed": "Completed",
    "dash.video.status.failed": "Failed",
    "dash.video.action.resume": "Resume Progress",
    "dash.video.action.view": "View Clips",

    // Upload
    "upload.title": "Upload Video",
    "upload.subtitle":
      "Upload a video file or paste a link to start generating clips.",
    "upload.tab.file": "Upload File",
    "upload.tab.link": "Paste Link",
    "upload.drag": "Drag & drop your video here",
    "upload.formats": "MP4, MOV, WEBM up to 2GB",
    "upload.browse": "Browse Files",
    "upload.paste": "Paste video URL",
    "upload.supports": "Supports YouTube, TikTok, Instagram Reels, and more.",
    "upload.process": "Process",

    // Editor
    "editor.preview": "Video Preview",
    "editor.mockClip": "THIS IS A CLIP",
    "editor.title": "Edit Clip",
    "editor.generate": "Generate",
    "editor.tab.text": "Text",
    "editor.tab.layout": "Layout",
    "editor.tab.ai": "AI",
    "editor.cap.settings": "Caption Settings",
    "editor.cap.enable": "Enable Captions",
    "editor.cap.auto": "Auto Generate",
    "editor.style.title": "Style",
    "editor.style.font": "Font Family",
    "editor.style.color": "Primary Color",
    "editor.style.size": "Font Size",
    "editor.layout.pos": "Positioning",
    "editor.layout.captionPos": "Caption Position",
    "editor.layout.offset": "Vertical Offset",
    "editor.ai.emoji": "Auto Emojis",
    "editor.ai.emojiDesc": "Add relevant emojis",
    "editor.ai.keywords": "Highlight Keywords",
    "editor.ai.keywordsDesc": "Colorize important words",

    // Clips
    "clips.title": "Your Clips",
    "clips.subtitle": "Manage, download, and share your generated clips.",
    "clips.search": "Search clips...",
    "clips.filter.all": "All",
    "clips.filter.ready": "Ready",
    "clips.filter.processing": "Processing",
    "clips.status.ready": "Ready",
    "clips.status.processing": "Processing",
    "clips.download": "Download",
    "clips.share": "Share",
    "clips.edit": "Edit",
    "clips.delete": "Delete",
    // Loading
    "load.title": "Generating Magic...",
    "load.subtitle": "Our AI is analyzing your video to find the best moments.",
    "load.step1": "Analyzing video content...",
    "load.step2": "Extracting highlights...",
    "load.step3": "Generating captions...",
    "load.step4": "Finalizing clips...",
    "load.processing": "Processing",
    "integrations.ytSettings": "YouTube Settings",
    "integrations.channelName": "Channel Name",
    "integrations.channelId": "Channel ID",
    "integrations.connectedAt": "Connected on",
    "integrations.disconnectBtn": "Disconnect Account",
    "integrations.close": "Close",
    "integrations.successMsg": "YouTube account connected successfully!",
    "integrations.editName": "Edit Name",
    "integrations.save": "Save",
    "integrations.cancel": "Cancel",
    "integrations.createNew": "Create Integration",
    "integrations.choosePlatform": "Choose a platform",
    "integrations.notInPlan": "Not available in your plan",
    "integrations.upgradeToUnlock":
      "Upgrade your plan to unlock this integration.",
    "integrations.emptyTitle": "No integrations yet",
    "integrations.emptyDesc":
      "Connect your social accounts to start publishing your viral shorts automatically.",
  },
  pt: {
    // Nav
    "nav.howItWorks": "Como funciona",
    "nav.features": "Recursos",
    "nav.pricing": "Preços",
    "nav.signIn": "Entrar",
    "nav.getStarted": "Começar",
    // Hero
    "hero.title1": "Transforme vídeos longos em shorts virais em ",
    "hero.title2": "segundos.",
    "hero.subtitle":
      "Nossa IA encontra automaticamente os momentos mais envolventes, adiciona legendas dinâmicas e formata seu vídeo para TikTok, YouTube Shorts e Instagram Reels.",
    "hero.startFree": "Comece grátis",
    "hero.watchDemo": "Ver demonstração",
    "hero.preview": "Prévia do Vídeo",
    "hero.autoCaptions": "LEGENDAS AUTO",
    // How it works
    "how.title": "Como funciona",
    "how.subtitle":
      "Três passos simples para transformar seu conteúdo longo em shorts virais.",
    "how.step1.title": "Envie seu vídeo",
    "how.step1.desc":
      "Cole um link do YouTube ou envie seu arquivo MP4 diretamente para nossa plataforma.",
    "how.step2.title": "A IA analisa o conteúdo",
    "how.step2.desc":
      "Nossa IA escaneia o vídeo em busca de ganchos, momentos envolventes e cria clipes perfeitos.",
    "how.step3.title": "Revise e exporte",
    "how.step3.desc":
      "Ajuste legendas, enquadramento e exporte seus shorts prontos para viralizar.",
    // Features
    "feat.badge": "Crie mais rápido",
    "feat.title": "Tudo que você precisa para viralizar",
    "feat.subtitle":
      "Pare de gastar horas editando. Deixe nossa IA fazer o trabalho pesado enquanto você foca em criar ótimo conteúdo.",
    "feat.1.title": "Cortes com IA",
    "feat.1.desc":
      "Nossa IA avançada analisa seu vídeo para encontrar os momentos mais envolventes e virais automaticamente.",
    "feat.2.title": "Legendas Dinâmicas",
    "feat.2.desc":
      "Adicione legendas animadas e altamente envolventes com um clique. Personalize fontes, cores e estilos.",
    "feat.4.title": "Publicação Automática",
    "feat.4.desc":
      "Conecte suas contas e publique diretamente no YouTube, TikTok e Instagram.",
    // Pricing
    "price.title": "Preços simples e transparentes",
    "price.subtitle":
      "Escolha o plano perfeito para suas necessidades de criação de conteúdo.",
    "price.free.title": "Start",
    "price.free.desc": "Inclui 150 créditos por mês",
    "price.free.btn": "Escolher Start",
    "price.free.price": "R$ 19,90",
    "price.pro.title": "Pro",
    "price.pro.desc": "Inclui 300 créditos por mês",
    "price.pro.btn": "Mudar para o Pro",
    "price.pro.price": "R$ 39,90",
    "price.ult.title": "Consultar",
    "price.ult.desc": "Volumes sob medida e suporte dedicado",
    "price.ult.btn": "Falar com Vendas",
    "price.ult.price": "Consultar",
    "price.mo": "/mês",
    "price.popular": "Mais Popular",
    // Footer
    "footer.rights": "© 2026 Kurt Cut. Todos os direitos reservados.",
    "footer.terms": "Termos",
    "footer.privacy": "Privacidade",

    // Auth
    "auth.login.title": "Bem-vindo de volta",
    "auth.login.desc": "Insira seu e-mail e senha para acessar sua conta",
    "auth.login.email": "E-mail",
    "auth.login.password": "Senha",
    "auth.login.forgot": "Esqueceu a senha?",
    "auth.login.submit": "Entrar",
    "auth.login.noAccount": "Não tem uma conta?",
    "auth.login.signup": "Cadastre-se",

    "auth.register.title": "Criar uma conta",
    "auth.register.desc": "Insira seus dados abaixo para criar sua conta",
    "auth.register.name": "Nome Completo",
    "auth.register.confirmPassword": "Confirmar Senha",
    "auth.register.submit": "Criar Conta",
    "auth.register.hasAccount": "Já tem uma conta?",

    // Sidebar
    "sidebar.dashboard": "Painel",
    "sidebar.upload": "Enviar",
    "sidebar.editor": "Editor",
    "sidebar.clips": "Clipes",
    "sidebar.integrations": "Integrações",
    "sidebar.upgrade": "Upgrade",
    "sidebar.settings": "Configurações",
    "sidebar.logout": "Sair",

    // Topbar
    "topbar.search": "Buscar clipes, vídeos...",
    "topbar.credits": "Créditos:",

    // Dashboard
    "dash.title": "Painel de Controle",
    "dash.subtitle":
      "Visão geral do processamento de vídeos e desempenho dos clipes.",
    "dash.metric.videos": "Vídeos Enviados",
    "dash.metric.shorts": "Shorts Criados",
    "dash.metric.time": "Tempo Processado",
    "dash.metric.views": "Total de Visualizações",
    "dash.chart.title": "Visão Geral de Desempenho",
    "dash.topClips.title": "Clipes com Melhor Desempenho",
    "dash.metric.topViews": "Mais Vistos",
    "dash.metric.topLikes": "Mais Curtidos",
    "dash.metric.trending": "Clipes em Alta",
    "dash.metric.low": "Baixo Desempenho",
    "dash.recentVideos.title": "Vídeos Recentes",
    "dash.video.status.processing": "Processando...",
    "dash.video.status.completed": "Concluído",
    "dash.video.status.failed": "Falhou",
    "dash.video.action.resume": "Ver Progresso",
    "dash.video.action.view": "Ver Clipes",

    // Upload
    "upload.title": "Enviar Vídeo",
    "upload.subtitle":
      "Envie um arquivo de vídeo ou cole um link para começar a gerar clipes.",
    "upload.tab.file": "Enviar Arquivo",
    "upload.tab.link": "Colar Link",
    "upload.drag": "Arraste e solte seu vídeo aqui",
    "upload.formats": "MP4, MOV, WEBM até 2GB",
    "upload.browse": "Procurar Arquivos",
    "upload.paste": "Colar URL do vídeo",
    "upload.supports": "Suporta YouTube, TikTok, Instagram Reels e mais.",
    "upload.process": "Processar",

    // Editor
    "editor.preview": "Prévia do Vídeo",
    "editor.mockClip": "ISSO É UM CLIPE",
    "editor.title": "Editar Clipe",
    "editor.generate": "Gerar",
    "editor.tab.text": "Texto",
    "editor.tab.layout": "Layout",
    "editor.tab.ai": "IA",
    "editor.cap.settings": "Configurações de Legenda",
    "editor.cap.enable": "Ativar Legendas",
    "editor.cap.auto": "Gerar Automaticamente",
    "editor.style.title": "Estilo",
    "editor.style.font": "Fonte",
    "editor.style.color": "Cor Principal",
    "editor.style.size": "Tamanho da Fonte",
    "editor.layout.pos": "Posicionamento",
    "editor.layout.captionPos": "Posição da Legenda",
    "editor.layout.offset": "Deslocamento Vertical",
    "editor.ai.emoji": "Emojis Automáticos",
    "editor.ai.emojiDesc": "Adicionar emojis relevantes",
    "editor.ai.keywords": "Destacar Palavras",
    "editor.ai.keywordsDesc": "Colorir palavras importantes",

    // Clips
    "clips.title": "Seus Clipes",
    "clips.subtitle": "Gerencie, baixe e compartilhe seus clipes.",
    "clips.search": "Buscar clipes...",
    "clips.filter.all": "Todos",
    "clips.filter.ready": "Prontos",
    "clips.filter.processing": "Processando",
    "clips.status.ready": "Pronto",
    "clips.status.processing": "Processando",
    "clips.download": "Baixar",
    "clips.share": "Compartilhar",
    "clips.edit": "Editar",
    "clips.delete": "Excluir",
    "clips.newProject": "Novo Vídeo",
    "clips.generated": "Gerado com IA",

    // Integrations
    "integrations.title": "Integrações",
    "integrations.subtitle":
      "Conecte suas contas sociais para publicação automática.",
    "integrations.ytDesc": "Publique diretamente no YouTube Shorts.",
    "integrations.ttDesc": "Publique diretamente no TikTok.",
    "integrations.igDesc": "Publique diretamente no Instagram Reels.",
    "integrations.fbDesc": "Publique diretamente no Facebook.",
    "integrations.connect": "Conectar",
    "integrations.connected": "Conectado",
    "integrations.manage": "Gerenciar",

    // Settings
    "settings.title": "Configurações",
    "settings.subtitle":
      "Gerencie as configurações e preferências da sua conta.",
    "settings.tab.account": "Conta",
    "settings.tab.security": "Segurança",
    "settings.tab.billing": "Faturamento",
    "settings.profile.title": "Perfil",
    "settings.profile.desc": "Atualize suas informações de perfil.",
    "settings.profile.name": "Nome",
    "settings.profile.email": "E-mail",
    "settings.profile.save": "Salvar Alterações",
    "settings.security.title": "Segurança",
    "settings.security.desc": "Altere sua senha.",
    "settings.security.current": "Senha Atual",
    "settings.security.new": "Nova Senha",
    "settings.security.confirm": "Confirmar Senha",
    "settings.security.update": "Atualizar Senha",
    "settings.billing.title": "Faturamento",
    "settings.billing.desc": "Você está no plano",
    "settings.billing.plan": ".",
    "settings.billing.nextDate": "Próxima cobrança",
    "settings.billing.perMonth": "/mês",
    "settings.billing.cancel": "Cancelar Plano",
    "settings.billing.manage": "Gerenciar Assinatura",

    // Loading
    "load.title": "Processando...",
    "load.downloading": "Baixando Video...",
    "load.subtitle":
      "Nossa IA está analisando seu vídeo para encontrar os melhores momentos.",
    "load.step1": "Analisando conteúdo...",
    "load.step2": "Extraindo destaques...",
    "load.step3": "Gerando legendas...",
    "load.step4": "Finalizando clipes...",
    "load.processing": "Processando",
    "integrations.ytSettings": "Configurações do YouTube",
    "integrations.channelName": "Nome do Canal",
    "integrations.channelId": "ID do Canal",
    "integrations.connectedAt": "Conectado em",
    "integrations.disconnectBtn": "Desconectar Conta",
    "integrations.close": "Fechar",
    "integrations.successMsg": "Conta do YouTube conectada com sucesso!",
    "integrations.editName": "Editar Nome",
    "integrations.save": "Salvar",
    "integrations.cancel": "Cancelar",
    "integrations.createNew": "Criar Integração",
    "integrations.choosePlatform": "Escolha uma plataforma",
    "integrations.notInPlan": "Assine o Plano PRO",
    "integrations.upgradeToUnlock":
      "Faça upgrade do seu plano para liberar esta integração.",
    "integrations.emptyTitle": "Nenhuma integração",
    "integrations.emptyDesc":
      "Conecte suas contas sociais para começar a publicar seus shorts virais automaticamente.",
  },
};
