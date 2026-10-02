// Fill this file when the API is ready. Keep API keys on the server.
window.CARD_STUDIO_CONFIG = {
  enabled: true,
  apiBase: 'https://cardstudio-production.up.railway.app',
  // Same-origin deployment can use an empty string. Use an absolute URL for a separate API.
  generatePath: '/api/generate',
  orderPath: '/api/orders',
  merchantLoginPath: '/api/admin/login',
  // Add more styles here without changing app.js. Each key is sent as style and its skill is sent as skill.
  styles: {
    ink: {category: 'scene', label: '水墨', description: '山水纸本 · 留白沉静', skill: 'scene-ink', prompt: `请将上传的照片重新创作为一张具有独立艺术表达的纸刊风插画海报。照片仅作为主体、空间关系、情绪与色彩的参考，成品全部重新绘制，不保留任何原照片像素，不做照片拼贴、描摹或写实滤镜。

先分析照片中的核心主体、主要动作、空间关系、原生配色与情绪，只保留最有辨识度的2—4个视觉线索，删去约65%—90%的描述性细节。围绕照片中具体的关系建立一个明确的表达主题，例如人物与辽阔景色之间的尺度差异、冷暖之间的变化、运动与静止之间的关系。通过形状、大小、间距、方向、遮挡与留白呈现主题，避免凭空添加象征物或装饰。

根据原照片方向选择画布：横图使用5:3，竖图使用3:5。采用米白色、可见粗纤维的自然纸张底纹，约68%—85%的画面保持安静留白，主体插画集中在约12%—32%的区域。构图根据主体的视觉重量灵活调整，采用不对称布局，允许重新组织原照片中的位置、比例与距离，避免机械居中、铺满画面或照搬照片构图。

以不规则剪纸形块、干刷印刷剪影、断续轮廓线、稀疏重复笔触中的一种作为主要绘画语言，最多搭配一种辅助语言。物体造型概括，轮廓允许中断，内部允许露出纸色，以平面的墨色与纸张形状表现主体，不使用写实明暗、光滑渐变或精致矢量描边。

让插画与空白纸面的交界服务于主体结构：可沿山脊、地平线、枝条或运动方向形成不规则撕纸纤维边缘，也可采用稀疏颗粒消散或自然独立轮廓。每张图选择一种主要边缘处理，避免统一套用撕裂矩形、厚重叠纸阴影或贴纸白边。

默认采用重点色模式：纸张与大部分插画使用低调的中性色或低饱和墨色，再根据照片的实际色彩与情绪选择一种明确的高饱和重点色。重点色必须落在有意义的主体、光线或辅助元素上，占整幅画面约0.8%—3%，用于引导视线或形成冷暖对照。颜色随每张照片调整，不固定使用蓝色、橙色或某一套配色，不添加无意义的彩色圆点或色块。

文字可有可无。仅在文字能增强画面表达时加入，内容由照片中的具体线索产生，语言、字体、大小、方向与位置自由安排，避免默认添加英文标题、地点标签、坐标或旅行口号。

整体呈现平面扫描纸质作品的触感：自然纸纤维、干墨缺口、细微孔版印刷颗粒、轻微不均匀着墨。画面有清晰的主次关系、充足的呼吸空间和适度未完成感，能够脱离原照片独立成立。

禁止原照片碎片、写实区域、完整风景照搬、照片滤镜、真实阴影、立体纸张、卷边、胶带、邮票、装饰网格、随机符号、密集手账拼贴、可爱卡通、动漫、儿童绘本风、光滑矢量图、商业广告排版、霓虹、电影光效、景深、Logo与水印。直接生成图片。`, previewTitle: '成品明信片', previewOriginal: 'assets/previews/styles/ink-original.webp', previewImage: 'assets/previews/styles/ink-result.webp'},
    crayon: {category: 'scene', label: '蜡笔版画', description: '蜡笔颗粒 · 明亮有趣', skill: 'scene-crayon-print', prompt: `请将上传的照片重新制作成以下风格：横屏4:3，双层纸张质感，外层是米白色粗糙粗纤维手工纸底纹，画面中间一块低饱和XXX色（根据每张照片调整颜色，禁止只生成单色，必须两种颜色或以上）横向窄矩形色块区域，用米白色哑光蜡粉笔手绘简化提取照片里的主体轮廓，极简松弛手绘线条，造型概括稚拙，去掉繁杂细节，保留物象核心形态，手绘随性不规整，轻微粗糙笔触感，色块上下大面积留白。复古安静治愈氛围，淡淡的做旧纸肌理， Risograph孔版印刷微弱颗粒噪点，低饱和莫兰迪配色，干净简约文艺卡片风格，无复杂阴影，无写实质感，没有多余装饰。`, previewTitle: '成品明信片', previewOriginal: 'assets/previews/styles/crayon-original.webp', previewImage: 'assets/previews/styles/crayon-result.webp'},
    travelSticker: {category: 'scene', label: '旅行贴纸', description: '风景纸片 · 旅行小物', skill: 'travel-paper-collage', prompt: `# 旅途纸片集

以用户提供的照片为内容来源，为每张照片重新组织一幅具有纸张触感的旅行插画。将地点的空间关系、值得记住的主体和少量日常细节结合起来，让成品适合收藏、分享和打印。

## 读取照片

查看实际照片，判断主体位置、景深方向、光线气氛和最有辨识度的细节。人物照片优先保存姿态、发型、穿着与互动；建筑照片优先保存立面比例、门窗关系与标志性结构；自然风景优先保存地形走向与天空、水面、植被的关系。根据这些观察生成新的构图。

仅使用用户有权提供的照片与素材。独立编写本次提示词，以照片内容和本技能的视觉规则进行创作。已有第三方成品可以帮助理解用户的审美偏好；正式生成时以用户照片为参考，重新设计布局、图形与装饰。

## 满幅场景与记忆小物

默认生成一张横向三比二成品；用户指定方向或尺寸时遵循指定值。将主场景贯穿整幅画面，使天空、墙面、水面或地面自然形成留白。以一个偏离中心的主体组织视觉重心，利用道路、窗沿、树枝或山脊引导视线。

从照片中选取二至四件具有情境意义的小物，按画面疏密决定实际数量。在场景边缘或前景将它们表现为局部放大的记忆纸片，采用斜向呼应、轻微叠压或跨越场景边界的摆放方式。让小物与主场景共同构成一幅画，保留足够的呼吸空间。纸片边缘采用窄而不均匀的原纸色，偶尔显露一小截半透明胶带或折角，数量以构图需要为准。

单人、情侣和宠物照片以主体关系为核心，小物选择衣饰、随身物品或现场自然元素。风景照片可选择岩石、船只、路牌轮廓或一段植被。素材丰富度低时减少小物，让主体保持清晰。

## 材料与色彩

采用有色纸拼贴结合干性彩铅的混合语言。以宽阔的纸片形状构成建筑、地形和人物，在少量关键连接处添加短而松弛的彩铅笔触。纸片呈现纤维细纹、微小色差和轻微毛边，层叠处用狭窄的低对比色差表达厚度。

根据照片选择一种环境底色、两至三种主体色和一种小面积强调色。日景保持清透，夜景采用深色纸面与局部暖色。将复杂纹理概括为疏密不同的色面，细节集中在识别主体所需的位置。整幅保留平面装饰感与可辨认的空间关系。

默认让图像本身承担叙事。用户要求文字时，仅加入用户确认的地点、日期或短句，并根据留白确定位置与字号。照片中的菜单和广告转化为色块与笔迹；明确需要保留的店名可以作为建筑细节重新绘制。

## 生成与检查

使用可用的图像生成工具创作图片；使用本地文件作为参考前先查看它。直接执行用户明确的生成请求。用户只要提示词时，将主体、构图、材料、色彩和输出要求合成一段完整的图生图指令。

检查主场景是否仍能对应照片，主体姿态与结构是否合理，小物是否来源明确，边缘叠压是否可读，文字是否准确，纸面质感是否统一。发现具体缺陷时针对该缺陷修订，完成后展示成品。

## 按需贴纸

仅当用户要求配套贴纸时额外生成独立透明图片。从已完成插画的小物中提取用户需要的元素，保持形状、配色和笔触一致，分别摆放并留出裁切间距。保留各个图案的窄纸边，输出真实带 Alpha 通道的 PNG。检查四角透明、纸片内部实心和边缘干净后再说明透明底已完成。工具无法输出或验证透明通道时如实说明。

## 商业交付边界

本技能文本为本次独立撰写，用户可以修改并用于自己的工作流程，包括商业项目。使用照片、字体、商标、外部素材及生成服务时分别遵守相关授权与条款。具体成品仍须结合实际内容判断权利状况，技能本身不作不侵权保证。

编辑在聊天中试用`, previewTitle: '成图示意', previewSplit: false, commercialUseAllowed: true, previewOriginal: 'assets/previews/styles/travel-sticker-original.webp', previewImage: 'assets/previews/styles/travel-sticker-result.webp'},
    tapeCollage: {category: 'scene', label: '胶带拼贴', description: '和纸胶带 · 留白拼贴', skill: 'make-tape-collage', prompt: `---
name: make-tape-collage
description: Transform a supplied photo or text description into a clean, tactile tape-collage raster artwork, or pair a faithfully preserved borderless photo print with a spacious warm-white paper panel containing a compact tape-built interpretation. Use for requests mentioning washi tape, masking-tape art, tape collage, 胶带拼贴, 和纸胶带拼贴, 胶带画, 拼贴手账, 保留原图, or photo-and-collage paper layouts.
---

# Make Tape Collage

Create one restrained bitmap artwork that feels physically assembled from washi tape on paper. Favor a structurally readable motif, generous negative space, simple tape colors or patterns, source-derived contextual echoes when useful, and believable translucent overlaps over dense scrapbook decoration.

## Load the style rules

Read [references/style-system.md](references/style-system.md) before generating. Read [references/prompt-recipes.md](references/prompt-recipes.md) when shaping or revising the image prompt.

Use the bundled images under \`assets/style-references/\` only when visual inspection would resolve ambiguity or help diagnose a weak result. Treat them as style references, never as subject matter to copy. For photo transformations and transparent motif generation, use \`02.png\` as the primary reference for composition, material, abstraction level, restrained contextual echoes, and perceived volume built from adjacent tape planes; never copy its sculpture. Use \`01.png\` as a supplementary material reference for fibrous translucency and medium-size layering, while ignoring its graphite outlines, centered layout, and dessert subject.

## Interpret the request

Classify the request as one of these paths:

- **Photo transformation:** Extract the main subject, silhouette, palette, or mood from the supplied image.
- **Preserved-photo paper composition:** When the user asks to preserve or retain the original photo, keep a faithful, unredrawn source-photo print and pair it with a separate tape-collage paper panel.
- **Description generation:** Invent a single clear tape-built motif from the brief.
- **Targeted revision:** Change only the requested property of a previously generated collage and preserve all other approved properties.

Choose the transformation mode from the user's wording. If unspecified, use these defaults:

- For any photo transformation, preserve one to three identification anchors and, when useful, add one or two quiet source-derived environmental echoes behind or beneath the subject. Use them to improve recognition or mood, never as generic scrapbook decoration.
- For a pet, person, food, plant, or single object, rebuild the recognizable subject from tape shapes and sparse narrow-tape details. Do not preserve facial identity.
- For a travel photo or complex scene, select one defining anchor and simplify aggressively instead of reproducing the whole scene.
- For an emotional or atmospheric brief, derive the palette, rhythm, and one symbolic motif rather than illustrating every noun literally.
- Use a cropped modern photo fragment, photocopy texture, or halftone only when the user requests it or when it materially improves recognition. Never make it look like vintage ephemera by default.

## Preserve the original photo

Use this mode only when the user asks to preserve, retain, keep, or show the original photo. User instructions always override these defaults.

- Choose the layout orientation from the source by default: for a portrait photo (\`height > width\`), place the faithful photo at left and the tape-collage paper panel at right; for a landscape or square photo (\`width >= height\`), place the faithful photo above and the paper panel below.
- Let the photograph occupy approximately 50% of the finished canvas and the paper panel approximately 50%.
- Default the complete photo-and-collage composite to \`3:4\` width-to-height portrait (also described as vertical 4:3). Follow an explicit alternate final ratio.
- Preserve the photo pixels faithfully and realistically. Never redraw, stylize, recolor, retouch, extend, erase, add, move, regenerate, rescale, or non-uniformly stretch anything inside the retained photo. Do not apply grain, tint, contrast, print-noise, or other overlays to the photo pixels by default. Express a convincing physical photo-print quality through the unaltered photographic surface, visibly fibrous torn edges, and a natural contact shadow outside the retained image content.
- When necessary to improve the fit, crop the source without resampling while retaining at least 80% of its original pixel area. Default to a centered crop; adjust the crop anchor only to protect the subject. Do not exceed 20% removed area. If that crop limit still cannot fill the photo panel, keep the retained pixels at original size and let the same continuous warm-white journal-paper sheet used by the rest of the canvas show through. Do not synthesize or sample a second filler texture; do not stretch, mirror, tile, or copy panel pixels or collage content. The paper surrounding the photograph and the paper panel must therefore join with identical color and texture continuity.
- Obey any explicit alternate orientation, panel order, or ratio. Keep the two layout zones exactly aligned at one perfectly straight horizontal or vertical division.
- Generate one isolated, text-free tape motif on a genuinely transparent RGBA background. Do not ask the image model to generate journal paper, page texture, captions, borders, broad page shadows, or the complete two-panel composition. Then use a deterministic raster compositor—not a generative edit—to scale and place the motif, synthesize the only paper surface used by the final output, mount the retained source pixels, and add typography. Prefer \`scripts/compose_direct_split.py --motif\`; use an equivalent local compositor only when necessary. This prevents generated paper pixels, stains, scan marks, and color casts from leaking around the motif.
- Present the faithful crop as a borderless physical photo print by default: no white frame or paper-stock border and no pixel-level print filter. Keep it straight and aligned with its photo zone by default; rotate it only when the user explicitly requests rotation. Shape every exposed photo edge with a slowly varying hand-torn contour, fine translucent fiber breakup, and softly antialiased irregularities; avoid uniformly jagged sawtooth noise or an obvious digital cutout. Use a restrained two-stage shadow—a broad pale ambient lift plus a narrow contact shadow that follows the torn fibers—so the print settles naturally onto the same paper rather than floating above it. Clip the photo and both shadow layers to the photo zone so neither can overlap the tape-collage motif or paper-panel content. Do not add a Polaroid frame, corner tape, curled photo, or dramatic floating depth.
- Run \`scripts/compose_direct_split.py --photo <PHOTO> --plan\` before motif generation. Use its resolved orientation, crop, final size, \`PHOTO_CONTENT_BOX\`, and \`PAPER_PANEL_SIZE\` to choose the motif's structural complexity, but do not generate a full paper panel. The script defaults to the orientation rules above, a 3:4 final canvas, a 50/50 split, a maximum 20% source-area crop, unchanged source pixels, straight photo placement, pronounced natural torn exposed edges, zone clipping, and one continuous independently synthesized paper sheet.
- Let the compositor place one compact tape-collage-and-caption group in a balancing corner. Never center it unless explicitly requested. Keep the whole group at about 20% of the paper panel by default and preserve about 80% as quiet negative space. Keep every part of the group safely inset from the paper-panel edges by at least about 9% of the panel's shorter side; do not let tape, wrinkles, shadows, or text touch or clip against an edge. It may grow when the source needs stronger expression, but must never exceed 60% of the paper panel. Correct scale, corner, inset, and caption placement deterministically; they never justify another image-generation call.
- For image-based work, add one concise factual English title near the tape motif by default. Derive one to three words from the visible image content, use clear faded typewriter lettering at a 26–32 pt equivalent with 28 pt as the default, and never overlap the motif. Use moderately dark faded ink, adequate tracking, and immediate legibility while keeping the title harmonious with the composition. Exact user-supplied text overrides the summary; omit text only when the user explicitly asks for no text.
- Generate the transparent motif without text, then add the decided title deterministically with \`scripts/compose_direct_split.py --motif <MOTIF> --caption "<TITLE>"\`. The compositor places the title close to, but outside, the motif by default; use explicit caption coordinates only when art direction requires them.
- Never add meaningless microtext, tickets, receipts, labels, stamps, seals, stickers, or archival filler.

Read the preserved-photo section in [references/style-system.md](references/style-system.md) and use the paper-composition recipe in [references/prompt-recipes.md](references/prompt-recipes.md) for this mode.

## Set the format

- Use \`3:4\` portrait when there is no input image and the user gives no ratio.
- For any image-based collage, default the finished asset to \`3:4\` width-to-height portrait unless the user overrides it. In preserved-photo mode this ratio applies to the complete photo-and-paper composite.
- For a minimal isolated object, let the motif occupy roughly 15–25% of the paper canvas. For the preferred structural photo transformation, let the complete motif group's bounding box occupy roughly 40–55% of the canvas width and 32–48% of its height, usually near the center or lower-middle, while retaining approximately 65–80% visually quiet paper. In preserved-photo mode, keep the motif-and-caption group compact at about 20% of the paper panel unless the user requests otherwise.
- On every paper-only canvas or paper panel, keep the complete tape motif and any text visibly inset from all page edges by at least about 9% of the shorter paper dimension unless the user explicitly requests edge contact or cropping.
- Present clean warm-white journal paper, never beige or strongly yellow. Its photographically believable uncoated notebook surface must combine unmistakably visible fine diffuse fibers in varied directions, a smaller number of softer long fibers, subtle mid- and fine-scale pulp-density variation, sparse neutral inclusions, and a few faint discontinuous scan traces. The texture must still read when the complete image is fitted to an ordinary screen: a nearly blank digital-white field is a failure. Build that visibility from localized fibers, short thread clusters, and fine pulp relief—not from stains or broad tonal clouds. Keep broad low-frequency mottling extremely weak so it cannot resemble grime, water damage, or uneven aging. The paper must remain clean, low contrast, non-repeating, and continuous across every exposed canvas area. Avoid dominant horizontal lines, stretched or mirrored texture, mechanical tiling, excessive yellowing, dirt, cracks, burns, water marks, grunge, and theatrical archival aging. A faint dot grid remains optional only when it supports the composition.

## Handle text

- For image-based work, default to one factual one-to-three-word English summary title. For description-only generation, default to no text.
- If the user supplies exact wording, use it instead. If the user explicitly requests no text, omit it.
- When requested, allow one short title and optionally one compact metadata line containing a date, location, or number.
- Default to English; use another language only when requested or supplied.
- Treat every requested character as exact. Quote the text verbatim in the prompt, spell tricky words letter by letter, and specify a restrained vintage typewriter face or journal-style handwriting.
- Keep typography secondary to the collage but distinctly legible, using 28 pt equivalent by default and normally staying within 26–32 pt. Use a clear typewriter face, adequate tracking, and a moderately dark faded-ink tone. Do not add slogans, paragraphs, fabricated dates, or decorative pseudo-writing.
- In preserved-photo mode, render the title deterministically after generating the text-free transparent motif rather than asking the image model to draw it.

## Generate or edit

Use the built-in image generation tool by default.

For a new image from text, omit image-reference parameters and express the complete visual system in the prompt.

For a photo transformation:

1. Inspect every local input image before generation.
2. Label each image role explicitly as \`edit target\`, \`style reference\`, or \`supporting input\`.
3. Use local referenced-image paths when all target images are local. If any target exists only in conversation context, include the smallest number of recent images that covers every target instead.
4. Never provide both local referenced-image paths and recent-conversation image inclusion in the same call.
5. If useful and compatible with the chosen input mechanism, include no more than two bundled style references. State that their subjects must not appear in the result.
6. Preserve only the source properties the user values: subject category, pose or silhouette, defining landmark, palette, or mood. Permit abstraction, cropping, illustration, photocopy, and halftone treatment as specified.

For a preserved-photo direct splice, do not pass the source photo into a generative full-composite edit. Generate only one isolated transparent RGBA tape motif, then assemble and verify the final flat image deterministically as described above. Use one ImageGen call by default. Allow at most one targeted generative revision, and only when subject recognition or the tape material itself fails. Layout, motif scale, position, safe inset, paper texture, photo treatment, and typography must be corrected locally and never justify a generative retry. The old \`--paper-panel\` input remains a legacy fallback, not the default workflow.

Shape the prompt using the recipe in [references/prompt-recipes.md](references/prompt-recipes.md). Keep it production-oriented and explicitly list constraints and avoid items.

## Validate and refine

Inspect the result before delivery. Confirm all of the following:

- The subject or emotional proposition remains understandable.
- The artwork reads as physical washi tape rather than flat vector shapes or a digital scrapbook.
- Pure-color tape and basic patterns dominate; translucent overlaps, slight wrinkles, lifted edges, and soft shadows remain believable and restrained.
- The collage reads as a flat journal clipping with shallow layers, not a volumetric paper sculpture. Match the preferred reference quality through approximately 10–18 coherent broad or medium hand-cut tape pieces, adjusted to subject structure, with translucent stacked planes, soft fibrous edges, and mild analog pigment variation. Preserve perceived volume when useful through adjacent light, middle, and dark tape faces, overlap order, and negative-space cuts without creating inflated or sculptural paper depth. Do not add gray graphite, pencil, pen, or ink outlines; communicate rims, handles, stems, grids, and structural edges through tape silhouettes, overlap seams, negative space, narrow tape strips, or simple tape patterns. Solid tape and familiar washi patterns such as stripes, checks, grids, and dots still dominate. Natural tape fiber, slight mottling, translucency, and overlap darkening are desirable; digital gradients, glossy vector fills, photographic texture, and ornate multicolor prints are not. Keep the combined area of any necessary fragmented color patches below 70% of the collage-motif region. Use narrow contact shadows and restrained creases to clarify construction; keep visibly wrinkled areas below about 25% of the collage-motif region.
- Negative space is generous, the page is not crowded, and the complete motif-and-caption group maintains a visible safe inset from every paper-panel edge.
- In preserved-photo mode, the complete canvas defaults to 3:4 portrait; portrait inputs resolve to left-right and landscape or square inputs to top-bottom unless overridden. Any source crop removes no more than 20% of source area. The retained photo pixels remain unchanged, without redraw, stretch, recoloring, or texture overlay. Physical-print character comes from a slowly varying torn contour, fine translucent edge fibers, and a restrained two-stage ambient/contact shadow—never from harsh sawtooth edges or a uniform dark halo. The photo and both shadow layers remain clipped to the photo zone and never overlap the tape motif. The final image uses one continuous clean warm-white procedurally synthesized journal-paper sheet behind both zones; its irregular fine fibers, a few longer soft threads, fine pulp relief, and faint discontinuous scan traces must remain clearly perceptible at fitted viewing size while broad mottling stays extremely weak. Reject a textureless digital-white page just as firmly as beige paper or dirty blotches. Uncovered photo-band space and the paper panel therefore share identical color and texture continuity without sampling or copying generated pixels. Reject stretching, mirroring, tiling, visible repetition, color shift, texture seams, or copied collage content. Require a genuine alpha channel around the motif; reject opaque paper mattes, checkerboard previews, colored halos, and full-panel assets. The motif-and-caption group sits in a balancing corner at about 20% by default, remains at least about 9% of the panel's short side from every paper edge, and never exceeds 60% unless the user explicitly requests another scale.
- No new tickets, labels, stamps, vintage-photo fragments, tape rolls, pens, or unrelated desk props appear in the generated collage or paper panel unless explicitly requested. Never alter a preserved source photo merely because it already contains one of these elements.
- For image-based work, one clear factual English summary is present by default unless the user opted out; any user-supplied text is exact and immediately legible. Description-only work remains text-free by default.
- No watermark, signature, logo, or accidental pseudo-text appears.

If a semantic or tape-material check fails, make at most one targeted generative revision and re-check. Repeat invariants in the revision prompt. Correct geometry, paper, photo mounting, or typography deterministically instead of regenerating. Do not casually alter an approved subject, palette, layout, or exact text while correcting another issue.

Return the final image inline. For workspace-bound work, copy the selected file into the requested project location and report its path, the final prompt, and that the built-in generation path was used.`, previewTitle: '成图示意', previewSplit: true, commercialUseAllowed: true, previewOriginal: 'assets/previews/styles/tape-collage-original.webp', previewImage: 'assets/previews/styles/tape-collage-result.webp'},
    portraitChalk: {category: 'portrait', label: '人像粉笔', description: '粉笔手绘 · 保留人物神态', skill: 'portrait-chalk', prompt: `请将我上传的照片制作成一张独立的高级设计海报，不多图拼接，采用3:4竖版构图

理解原照片最值得被记住的**核心主题、主体关系、结构走势、情绪与视觉隐喻**，再重构为**复古纸张肌理的粉彩蜡笔涂鸦插画**。不要逐物复制照片，也不要把所有内容完整转绘，只保留最能代表原物的轮廓、姿态、方向和视觉记忆点，通过删减、概括、轻微夸张和重新组合，使人一眼感受到它与上方照片之间的对应关系。

主体使用**粗颗粒粉笔 / 蜡笔式手绘轮廓**：线条略粗、松弛、干涩，带有粉末颗粒、断续掉色、轻微抖动和不完全闭合的边缘，笔端自然钝圆。主体内部只加入极少量粉彩色块、简单网格、条纹、圆点或随手涂抹，用最少信息提示结构，不做写实体积和完整细节。

周围小元素与主体使用**同一种线条语言**，但进一步压缩为一笔或几笔即可识别的涂鸦符号。星星、花朵、植物、器物、环境线索或抽象符号都应简单、稚拙、开放、不完全闭合，以单线轮廓为主，极少填色。不要画成精致图标、贴纸或独立小插画。

构图保持**小尺度章印与大面积留白**的关系，根据主体自身的方向、比例和视觉重心自由安排位置，可偏心、贴边、悬置或局部裁切。主体与极少量涂鸦符号形成松散但明确的视觉群落，其余空间主动留空。**留白本身就是主要构图元素**，通过空与实、聚与散、大小反差和不对称关系形成呼吸感、距离感与停顿感；宁可少画，也不要填满。

背景必须使用**极浅、明亮、干净的纸张底色**，例如奶油白、象牙白、浅米白、淡杏白、极浅灰白或根据原图综合色温智能匹配的近白纸色。纸张只保留非常轻微的纤维与颗粒，不能偏棕、偏黄、偏灰或显得陈旧。**背景明度必须明显高于主体线条与色块，确保所有蜡笔轮廓、小符号和文字清楚可见，不得与背景糊在一起。**

配色从上方照片中提取 **2–4 种最鲜活、最有亲和力、最能代表画面精神的颜色**重新调制，转化为明亮柔和的粉彩蜡笔色。可自然形成蜜桃粉、杏橙、奶油黄、薄荷青、天空蓝、淡紫等轻盈色彩；主体线条优先使用比背景更清晰的珊瑚粉、柔蓝、青绿、暖橙、淡紫或奶油深色调，小元素只零星重复这些颜色形成呼应。整体保持**浅背景 + 清晰彩线 + 少量柔和色块**的对比关系，明快、治愈、轻松、有生活感。避免灰暗、脏褐、沉闷莫兰迪化、低对比、荧光色和廉价糖果感。

文字少量介入，不限制语种。可从主体、动作、情绪、记忆或隐喻中自由提炼短句或文字片段，使用**轻薄、疏朗、带轻微字距不齐与旧式机械印字误差的打字排版字体**，颜色使用清晰但不刺眼的灰褐、柔黑、深蓝灰或与主体呼应的深色，确保在浅色纸面上有足够可读性。文字自然散落在留白区域，与主体和涂鸦形成图文混排，不做固定标题模板。

整体呈现**极浅纸面、粗颗粒蜡笔轮廓、少量粉彩填色、极简涂鸦符号、小尺度主体与大量艺术留白**共同构成的高级治愈视觉。重点是让主体与小元素清楚浮现在浅色纸面上，同时保持松弛、天真、温柔和成熟的编辑构图意识。避免深色牛皮纸、暗棕背景、低对比线条、背景与主体糊成一团、精细描边、写实转绘、复杂小图标、背景填满、光滑矢量、3D感和商业模板感。`, previewTitle: '成品明信片', previewSplit: false, previewOriginal: 'assets/previews/styles/portrait-chalk-original.webp', previewImage: 'assets/previews/styles/portrait-chalk-result.webp'},
    portraitHeart: {category: 'portrait', label: '人像剪纸爱心', description: '细红线爱心 · 平面剪纸', skill: 'red-thread-paper-keepsake', prompt: `---
name: red-thread-paper-keepsake
description: 将用户照片重新创作为浪漫的平面剪纸与丝网印刷风纪念卡，结合自然纸面留白、场景形块、主体跨界和细红线爱心。用于情侣、朋友、家人、单人及人与宠物的照片艺术化处理，自动根据照片调整构图、配色和爱心轮廓。
---

# 红线纸影

根据用户上传的照片生成一张完整的纸质艺术纪念卡。保持照片中特有的主体、动作和关系，让细红线形成围绕主体的手绘爱心。

用户未指定的构图、配色与线条路径应根据照片自主决定。默认直接生成图片；用户明确要求提示词时，只输出提示词。

## 理解照片

生成前查看实际照片，识别主要主体、数量、姿势、朝向、相互关系、重要轮廓和场景特征。

从背景中选择少量能代表这张照片的元素。根据实际照片保留山脊、树木、窗户、建筑、家具、海岸或其他必要线索，删去杂乱且重复的细节。

保留原照片表达的关系，不将朋友或家人擅自改成情侣，不添加亲吻、拥抱或其他原图没有的动作。

多张照片中若主体照片已经明确，直接使用；若无法判断，询问使用哪一张。

## 画布与构图

优先遵循用户指定尺寸。未指定时，横向照片使用3:2，纵向照片使用2:3，正方形照片根据主体姿势选择方向。

使用干净、明亮的米白或自然白纸底，带细微纸纤维。根据构图保留约30%—50%的安静纸面，避免主体和背景铺满画布。

将必要背景整理成一个连贯的纸片形块。形块轮廓根据场景结构设计，可采用略倾斜的多边形、自然弧形或简洁的不规则边缘。边缘只有轻微手剪起伏，不使用厚重刷痕或统一套用撕纸矩形。

让主体的脚部、衣摆、手臂或其他合适部位自然跨出背景形块，进入纸面留白。根据照片选择跨界位置，保证身体完整、动作清楚。

背景、主体和红线应构成一个整体，不拆成多个独立展示区域。

## 平面绘画语言

使用彩色剪纸形块与丝网印刷语言。每个主要形状以平涂色面表现，仅带细微着墨不均和轻薄颗粒。

人物保留原有发型、衣物配色、身体比例与互动关系。面部使用简洁轮廓和必要的少量五官，衣物用少量大色块概括。

动物保留物种、体态、耳朵、尾巴和重要毛色特征。物品保留最有辨识度的外形。

根据主体大小决定细节量。主体较小时，优先保证轮廓、姿势和辨识特征，不强行绘制密集五官。

禁止油画厚涂、颜料堆积、明显水粉刷痕、写实皮肤、复杂明暗、光滑渐变和立体纸张效果。不要把全体主体统一处理成纯白镂空。

## 纤细的表面爱心线

在完成的插画最上层，用一根极细的朱红线画出一颗舒展的爱心。线条具有细尖绘图笔的精度，呈现单次落笔形成的连续笔迹，轻盈、清晰、平滑。

以画面短边1024像素为例，红线宽度约为1—1.5像素；其他尺寸等比例调整。整条线保持基本一致的纤细程度，转弯处同样轻薄。红线使用均匀的单色墨迹，边缘整洁，纸张纹理在其下方轻微透出。

爱心作为画面内部的一笔构图线，围绕主要人物展开，外侧保留充足纸面。根据人物位置自由调整大小与倾斜角度，让顶部圆弧舒展，两侧自然收拢，底部尖端落在合适的留白中。整体略微不对称，弧线流畅，具有随手一笔画成的松弛感。

爱心保持独立轮廓，与人物身体之间形成宽松空间。人物和关键互动位于爱心内部，少量衣摆、四肢或景物可以与红线自然相交。

红线始终印在画面表面，经过背景、衣服和白纸时保持同样的线宽与连续性。路径避开面部与关键手势，允许轻轻跨过衣摆或腿部。末端可延伸出一小段纤细弯曲的线头。

视觉主次为：先看到人物与场景，再注意到这根轻轻框住画面的红线。缩小观看时，红线仍可辨认，并保持精致、克制的存在感。

## 配色与纸感

从原照片提取主要色彩，整理为少量协调的印刷色，保留原图冷暖关系。
通过色面面积和明度建立主次，让主体关系与红线成为视觉中心。红线之外避免添加无关的高饱和装饰。

纸纤维和颗粒保持细微，不覆盖面部、手指或重要轮廓。整体保持平面、哑光、清爽。

照片有明确地面时，可保留与脚部相连的低对比平面影子。影子应服从实际光线和构图，不生成另一组独立主体。

## 文字与输出

默认不添加文字。用户指定文字时，准确保留内容，根据留白安排克制的手写或印刷文字。

不自动添加诗句、旅游口号、坐标、编号、署名、Logo或水印。

输出完整卡片画面，不展示桌面、相框、手持照片或产品样机。重要主体与爱心距离裁切边缘至少为画面短边的5%。

## 生成与检查

将以上规则转化为针对当前照片的具体生图指令，附上主体照片，使用图片生成工具生成。

检查主体数量、姿势、肢体、互动关系和轮廓是否正确；检查爱心是否包围主要主体、是否遮挡面部或关键动作；检查是否出现油画厚涂、拥挤构图或额外装饰。

发现明确缺陷时，只针对该缺陷修改，保留已经正确的部分。

交付图片，并用一句简短说明介绍本次构图。除非用户要求，不展示内部分析和完整生图指令。`, previewTitle: '成品明信片', previewSplit: false, previewOriginal: 'assets/previews/styles/portrait-heart-original.webp', previewImage: 'assets/previews/styles/portrait-heart-result.webp'}
  },
  // Bundled from the provided font file. Replace only if the licensed font changes.
  fontFaces: {
    'Huiwen Mincho': {url: 'assets/fonts/huiwen-mincho.otf', format: 'opentype'}
  },
  // Public static asset for the stall's personal WeChat QR code. Personal QR codes require manual verification.
  paymentQrUrl: 'assets/payment/wechat-personal-qr.jpg',
  // Optional URL opened by the "打开收款码" link. A QR image is usually more reliable for a stall.
  paymentUrl: '',
  pollMs: 2500
};
