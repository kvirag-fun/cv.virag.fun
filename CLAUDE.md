Rules for Claude Code to abide by:

1. This repo is a personal CV website.
2. This repo is deployed via GitHub pages, thus cannot contain unsupported logic.
3. This repo is public.
4. This repo cannot contain sensitive private information.
5. All personal information is injected during the build via secrets named CV_SOURCE_JSON.
6. The image shown in the CV is is injected during the build via secrets named CV_PORTRAIT_BASE64.
7. The deployed website files are encrypted, the encryption key is injected during the build via secrets named SITE_PASSWORD.
8. Secrets are stored within the private repo cv.virag.fun_private.
