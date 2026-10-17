# Unbound Assistant

A standalone AI workspace inside this repository. It is separate from CloudForge and Survival AI.

## What works in this starter

- Chat powered by the OpenAI Responses API with web search
- Image generation and image editing through the OpenAI Images API
- Speech generation and audio transcription through the OpenAI Audio API
- Sandboxed Python code execution through the Responses API Code Interpreter tool
- Optional isolated Linux workspace through E2B for shell commands, source inspection, file uploads, and authorized binary analysis
- Optional video generation through a configured Replicate model
- Dedicated Chat, Image, Video, Speech, and Code / isolated Workspace modes in the UI
- Live Workspace Dashboard with provider and integration configuration status
- Selectable text-chat provider: OpenAI, Anthropic, Google Gemini, or a configured OpenAI-compatible HTTPS endpoint
- Browser-local chat history and user-controlled memory notes
- Read-only GitHub repository inspection through a fine-grained token (optional)\n- Agent tool loop for connected GitHub reads and isolated sandbox commands\n- Server-side provider keys (never exposed in frontend code)
- App-password protection for provider-backed endpoints
- Per-IP in-memory request limits for chat, image, and video endpoints
- Health endpoint that reports which integrations are configured

This is an extensible foundation, not a claim of unlimited or unrestricted ability. Each generation service must be configured and can have its own costs, account requirements, rate limits, and content rules. The video provider is configurable because available models and input schemas vary.

## Setup

See [API-SETUP.md](./API-SETUP.md) for the exact credentials, where to obtain them, which features each enables, and which planned integrations are not connected yet.

Requires Node.js 20 or newer.

1. Copy `.env.example` to `.env`.
2. Set `OPENAI_API_KEY` and a random `APP_ACCESS_PASSWORD` of at least 16 characters.
3. Optionally set `OPENAI_MODEL` and `OPENAI_IMAGE_MODEL`.
4. Run `npm install`, then `npm start`.
5. Open `http://localhost:3000` and use **Access** to enter the app password.

Keep `.env` private. Never commit provider tokens, paste them into chat, or put them in frontend code.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | For chat and images | Server-side key for the OpenAI API |
| `APP_ACCESS_PASSWORD` | Yes | Shared app password, minimum 16 characters |
| `OPENAI_MODEL` | No | Chat model; defaults to `gpt-5` |
| `ANTHROPIC_API_KEY` | Optional | Enables Anthropic text chat and security tests |
| `ANTHROPIC_MODEL` | No | Anthropic model; defaults to `claude-sonnet-4-5` |
| `GEMINI_API_KEY` | Optional | Enables Google Gemini text chat and security tests |
| `GEMINI_MODEL` | No | Gemini model; defaults to `gemini-2.5-flash` |
| `AI_COMPAT_BASE_URL` | Optional | HTTPS base URL for an OpenAI-compatible chat API |
| `AI_COMPAT_MODEL` | With compatible URL | Model name for that endpoint |
| `AI_COMPAT_API_KEY` | No | Optional key for the compatible endpoint |
| `OPENAI_IMAGE_MODEL` | No | Image model; defaults to `gpt-image-2` |
| `OPENAI_AUDIO_MODEL` | No | Text-to-speech model; defaults to `gpt-4o-mini-tts` |
| `OPENAI_TRANSCRIBE_MODEL` | No | Audio transcription model; defaults to `gpt-transcribe` |
| `ENABLE_SHELL_TOOL` | No | Set to `true` only if your chosen model supports the hosted Responses shell tool; otherwise leave `false` |
| `E2B_API_KEY` | For isolated workspace | Server-side E2B key; enables Code / reverse engineer mode |\n| `GITHUB_TOKEN` | For repository inspection | Fine-grained GitHub token scoped to selected repositories, Metadata read and Contents read |\n| `REPLICATE_API_TOKEN` | For video | Server-side Replicate token |
| `REPLICATE_VIDEO_MODEL` | For video | Currently available Replicate model slug in `owner/name` format |
| `REPLICATE_VIDEO_DEFAULT_INPUT` | No | Optional JSON object for model-specific inputs such as aspect ratio or duration |
| `PORT` | No | Server port; defaults to 3000 |

### Image generation

Select **Generate image**, describe the image, and submit. The server calls the OpenAI Images API. The default model and output format can be changed using server environment settings and the image route. Image API access may require account verification or billing configuration with the provider.

### Image editing

Choose a PNG, JPEG, or WEBP image in the **Edit an image** row, type the requested changes into the main message box, then select **Apply prompt to image**. This calls the OpenAI image edits endpoint. The original file is sent to the provider for that request; it is not stored in a persistent media library by this starter.

### Speech and transcription

Choose **Generate speech** to turn text into spoken MP3 audio. The UI labels the result as AI-generated speech. To transcribe an existing recording, choose an audio file in the **Transcribe audio** row and select **Transcribe file**. The transcription endpoint accepts files up to 25 MB; supported types depend on the provider. The default transcription model is `gpt-transcribe`.

### Python code interpreter

Chat requests now enable the Responses API Code Interpreter tool for sandboxed Python, calculations, and supported data/file analysis. This is not the same as a persistent development machine: it does not automatically give the assistant access to your GitHub repository, the Render filesystem, or arbitrary shell commands.

### Hosted shell tool (optional)

If your selected OpenAI model supports the Responses API shell tool, set `ENABLE_SHELL_TOOL=true`. This gives the model a hosted command-line environment for coding tasks. It is not your Render service or GitHub repository by default, and should not be treated as a production workspace without explicit repository sync, checkpoints, resource limits, and auditing. Leave this off if the API rejects the tool for your chosen model.

### GitHub repository inspection\n\nSet `GITHUB_TOKEN` to a fine-grained token limited to repositories Unbound may inspect. In Chat mode, the agent can discover accessible repositories, list project files, and read text source files. Start with Metadata read and Contents read. This integration is read-only; it does not push changes or bypass private-repository permissions.\n\n### Isolated coding and reverse-engineering workspace\n\nSet `E2B_API_KEY` in the server environment to enable **Code / reverse engineer** mode. It creates a temporary isolated Linux sandbox, executes shell commands there, and lets you upload a file for inspection. Try `pwd && ls -la`, or upload an authorized binary and run `file /home/user/filename` and `strings -n 8 /home/user/filename`. Commands are limited to 120 seconds; sandboxes expire after five minutes and are not a persistent project workspace. E2B usage may cost money. This sandbox does not bypass encryption or grant access to systems you do not have permission to inspect.\n\n### Video generation

Select **Generate video** after configuring `REPLICATE_API_TOKEN` and `REPLICATE_VIDEO_MODEL`. Pick a currently available video model from your Replicate account/catalog and verify its expected input schema. The starter sends the prompt plus any fields in `REPLICATE_VIDEO_DEFAULT_INPUT`, which must be a JSON object. Use the input fields documented for your selected model (for example, aspect ratio or duration); models with unusual schemas may still need a model-specific adapter. The UI polls the job and displays the returned output when it is a playable URL.

## Deploy on Render

Create a **Web Service** from this repository and set **Root Directory** to `unbound-assistant`.

- Build command: `npm install`
- Start command: `npm start`

Add the environment variables in the service's secret/environment settings. At minimum, set `OPENAI_API_KEY` and a strong `APP_ACCESS_PASSWORD`. Add the Replicate variables only if you want video generation. Add `E2B_API_KEY` if you want the isolated coding/reverse-engineering workspace, and `GITHUB_TOKEN` if you want repository inspection. Enable the shell tool only after confirming support for your chosen API model. Do not publish provider secrets in GitHub.

## Memory

Type `Remember: I prefer step-by-step answers` in Chat mode to save a note. Use **Memory** to review or delete notes. Type `Forget all memories` to clear browser-local memory. Chat history and memories are stored only in the current browser; they do not sync between devices and can be lost when browser data is cleared. Do not save passwords or API keys as memories.

## Security and costs

- The app password is a shared access gate, not full user accounts. Use a long random value and only share it with trusted users.
- Request limits are in-memory and per server process; they are not a substitute for account authentication, a persistent quota system, or provider-side spending limits.
- Publicly reachable hosting can still incur API costs from people who know the shared password. Configure provider-side budgets/alerts and restrict deployment access where possible.
- Generated image data is returned to the browser and is not currently stored in a durable media library.
- Do not use this starter as a production multi-tenant service without proper identity, durable rate limits, quotas, monitoring, and access controls.

## Next engineering milestones

1. Add real user authentication and database-backed memories/projects.
2. Add a task planner with checkpoints, resumable jobs, and audit history.
3. Add a controlled coding workspace with isolated execution, file editing, tests, and time/resource limits.
4. Add authorized GitHub integration so users can explicitly select repositories and review proposed changes.
5. Add provider adapters for more image/video/audio models and model-specific parameters.
6. Add durable media storage, background jobs, deployment checks, and usage metering.

## Multi-provider text chat

Open the Dashboard to refresh the list of configured providers, then choose a text model from the **Text model** selector. The selection is saved in this browser. OpenAI chat retains the app\u2019s web search, Python code interpreter, and connected agent tools. Anthropic, Gemini, and OpenAI-compatible providers currently support text chat only in this selector; they do not inherit OpenAI-specific tools. Provider API access and billing must be configured with the provider directly.

The assistant must only report actions as completed after the relevant tool/provider confirms success. No prompt can create capabilities that have not been connected or provisioned.
