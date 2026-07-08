const PROVIDERS = [
  {
    id: 'piper-local-tts',
    name: 'Piper TTS',
    category: 'voice',
    repo: 'https://github.com/rhasspy/piper',
    currentRepo: 'https://github.com/OHF-voice/piper1-gpl',
    license: 'MIT original / GPL-3.0 current fork',
    maturity: 'production-ready local engine',
    setupMode: 'local_cli_or_server',
    fitScore: 91,
    envKeys: ['PIPER_BIN', 'PIPER_VOICE_MODEL'],
    workerCommand: 'piper --model %PIPER_VOICE_MODEL% --output_file <output.wav>',
    workerInputs: ['text', 'voiceModel', 'outputPath'],
    outputContract: ['audioUrl', 'manifestUrl', 'durationSeconds', 'providerStatus'],
    strengths: ['Fast offline voice generation', 'Good privacy profile', 'Simple command-line integration'],
    cautions: ['Current active fork is GPL-3.0, so isolate it as a separate process for commercial deployments', 'Voice model licenses still need per-model review'],
    integrationPlan: ['Add Piper binary/model path settings', 'Call Piper as an external worker', 'Store generated WAV in existing storage folder'],
    recommended: true
  },
  {
    id: 'coqui-tts',
    name: 'Coqui TTS',
    category: 'voice',
    repo: 'https://github.com/coqui-ai/TTS',
    license: 'MPL-2.0 code, model licenses vary',
    maturity: 'broad toolkit',
    setupMode: 'python_worker',
    fitScore: 86,
    envKeys: ['COQUI_TTS_MODEL', 'COQUI_TTS_DEVICE'],
    workerCommand: 'python -m TTS.bin.synthesize --model_name <model> --text <text> --out_path <output.wav>',
    workerInputs: ['text', 'model', 'speakerReference', 'language', 'outputPath'],
    outputContract: ['audioUrl', 'manifestUrl', 'voice', 'language', 'providerStatus'],
    strengths: ['Large language/model coverage', 'Training and fine-tuning utilities', 'Voice cloning workflows'],
    cautions: ['Review every model license before commercial use', 'Python/GPU setup can be heavier than Piper'],
    integrationPlan: ['Add Python worker contract', 'Expose model picker', 'Cache generated voice manifests'],
    recommended: true
  },
  {
    id: 'f5-tts',
    name: 'F5-TTS',
    category: 'voice',
    repo: 'https://github.com/SWivid/F5-TTS',
    license: 'MIT code, pretrained models CC-BY-NC',
    maturity: 'strong research adoption',
    setupMode: 'python_worker_gpu',
    fitScore: 78,
    envKeys: ['F5_TTS_MODEL_DIR', 'F5_TTS_DEVICE'],
    workerCommand: 'python infer-cli.py --model <model> --ref_audio <voice.wav> --gen_text <text>',
    workerInputs: ['text', 'referenceAudio', 'modelDir', 'device', 'outputPath'],
    outputContract: ['audioUrl', 'manifestUrl', 'licenseReview', 'providerStatus'],
    strengths: ['High-quality zero-shot voice cloning', 'Active releases', 'Useful for research demos'],
    cautions: ['Bundled pretrained models are non-commercial', 'Needs a commercially cleared model before paid usage'],
    integrationPlan: ['Add research-mode provider flag', 'Require explicit model license note', 'Route only manual review jobs at first'],
    recommended: false
  },
  {
    id: 'sadtalker',
    name: 'SadTalker',
    category: 'avatar',
    repo: 'https://github.com/OpenTalker/SadTalker',
    license: 'Apache-2.0 per current README',
    maturity: 'established talking-head pipeline',
    setupMode: 'python_worker_gpu',
    fitScore: 84,
    envKeys: ['SADTALKER_ROOT', 'SADTALKER_CHECKPOINT_DIR'],
    workerCommand: 'python inference.py --driven_audio <voice.wav> --source_image <avatar.png> --result_dir <output>',
    workerInputs: ['audioPath', 'avatarImagePath', 'checkpointDir', 'outputDir'],
    outputContract: ['videoUrl', 'avatarJobId', 'renderMetadata', 'providerStatus'],
    strengths: ['Single-image talking-head generation', 'WebUI and community workflows', 'Good fit for avatar render jobs'],
    cautions: ['Checkpoint/source media rights still need review', 'GPU runtime can be slow for batch exports'],
    integrationPlan: ['Create avatar render worker adapter', 'Pass generated WAV and avatar image', 'Attach output MP4 to project export metadata'],
    recommended: true
  },
  {
    id: 'musetalk',
    name: 'MuseTalk',
    category: 'lip_sync',
    repo: 'https://github.com/TMElyralab/MuseTalk',
    license: 'review-required',
    maturity: 'advanced lip-sync research',
    setupMode: 'python_worker_gpu',
    fitScore: 80,
    envKeys: ['MUSETALK_ROOT', 'MUSETALK_MODEL_DIR'],
    workerCommand: 'python scripts/inference.py --video_path <input.mp4> --audio_path <voice.wav>',
    workerInputs: ['audioPath', 'videoPath', 'modelDir', 'outputDir'],
    outputContract: ['videoUrl', 'lipSyncMetadata', 'licenseReview', 'providerStatus'],
    strengths: ['High-quality audio-driven lip-sync', 'Real-time inference path documented', 'Supports multiple languages'],
    cautions: ['License and pretrained checkpoint terms must be reviewed before commercial use', 'GPU and model dependencies are significant'],
    integrationPlan: ['Keep as experimental provider', 'Add worker health check', 'Use only user-owned footage or generated avatars'],
    recommended: false
  },
  {
    id: 'wav2lip',
    name: 'Wav2Lip',
    category: 'lip_sync',
    repo: 'https://github.com/Rudrabha/Wav2Lip',
    license: 'non-commercial research use',
    maturity: 'classic lip-sync baseline',
    setupMode: 'research_only',
    fitScore: 62,
    envKeys: ['WAV2LIP_ROOT'],
    workerCommand: 'python inference.py --checkpoint_path <checkpoint.pth> --face <input.mp4> --audio <voice.wav>',
    workerInputs: ['audioPath', 'faceVideoPath', 'checkpointPath', 'outputPath'],
    outputContract: ['videoUrl', 'researchOnly', 'providerStatus'],
    strengths: ['Well-known baseline', 'Many tutorials and community notebooks', 'Useful for internal experiments'],
    cautions: ['Do not ship commercially with the public pretrained model', 'Use only for research unless a separate license/model is obtained'],
    integrationPlan: ['List as reference only', 'Do not enable in production plans', 'Prefer MuseTalk/SadTalker or licensed APIs for paid usage'],
    recommended: false
  },
  {
    id: 'remotion',
    name: 'Remotion',
    category: 'render',
    repo: 'https://github.com/remotion-dev/remotion',
    license: 'special commercial license',
    maturity: 'mature React video stack',
    setupMode: 'node_render_worker',
    fitScore: 82,
    envKeys: ['REMOTION_RENDER_MODE'],
    workerCommand: 'npx remotion render <composition> <output.mp4> --props <project-package.json>',
    workerInputs: ['projectPackage', 'compositionId', 'outputPath'],
    outputContract: ['videoUrl', 'renderMetadata', 'subtitlesUrl', 'providerStatus'],
    strengths: ['React-based programmatic videos', 'Excellent template workflow', 'Good fit for social video variants'],
    cautions: ['Company/commercial usage may require a license', 'Keep FFmpeg renderer as default until license is confirmed'],
    integrationPlan: ['Prototype template renderer', 'Keep export props compatible with current project package', 'Confirm license before production rollout'],
    recommended: true
  }
];

function configuredProvider(provider) {
  return provider.envKeys.some(key => Boolean(process.env[key]));
}

function categoryCounts(providers) {
  return providers.reduce((acc, provider) => {
    acc[provider.category] = (acc[provider.category] || 0) + 1;
    return acc;
  }, {});
}

function readiness(provider) {
  if (configuredProvider(provider)) return 'configured';
  if (provider.license.includes('non-commercial') || provider.license.includes('review-required')) return 'review-required';
  if (provider.setupMode.includes('gpu')) return 'needs-worker';
  return 'ready-to-wire';
}

function envStatus(provider) {
  return provider.envKeys.map(key => ({
    key,
    configured: Boolean(process.env[key])
  }));
}

function sampleRequest(provider) {
  const base = {
    providerId: provider.id,
    category: provider.category,
    jobId: 'job_provider_demo',
    projectId: 'project_demo',
    outputDir: './storage/provider-renders'
  };

  if (provider.category === 'voice') {
    return {
      ...base,
      text: 'Create a polished voiceover for this AI avatar video.',
      language: 'English',
      voiceId: 'calm_male',
      outputPath: './storage/provider-renders/demo.wav'
    };
  }

  if (provider.category === 'render') {
    return {
      ...base,
      compositionId: 'VerticalAvatarExport',
      projectPackagePath: './exports/project-package.json',
      outputPath: './storage/provider-renders/demo.mp4'
    };
  }

  return {
    ...base,
    audioPath: './storage/provider-renders/demo.wav',
    avatarImagePath: './generated-assets/avatar.png',
    outputPath: './storage/provider-renders/demo.mp4'
  };
}

function buildChecklist(provider) {
  const env = envStatus(provider);
  const missingEnv = env.filter(item => !item.configured).map(item => item.key);
  return [
    {
      id: 'license-review',
      label: 'Review code, model, checkpoint, and media licenses',
      done: provider.readiness === 'configured' || (!provider.license.includes('non-commercial') && !provider.license.includes('review-required')),
      detail: provider.license
    },
    {
      id: 'env-config',
      label: 'Configure required environment variables',
      done: missingEnv.length === 0,
      detail: missingEnv.length ? `Missing: ${missingEnv.join(', ')}` : 'All required env vars are present'
    },
    {
      id: 'worker-isolation',
      label: 'Run provider as an isolated worker process',
      done: provider.setupMode !== 'research_only',
      detail: provider.setupMode
    },
    {
      id: 'contract-map',
      label: 'Map worker output into existing project export metadata',
      done: true,
      detail: provider.outputContract.join(', ')
    },
    {
      id: 'safety-gate',
      label: 'Use only owned or licensed media and voices',
      done: true,
      detail: 'Keep impersonation, bypass, and spam workflows disabled'
    }
  ];
}

export function listProviderCatalog({ category, recommendedOnly = false } = {}) {
  const providers = PROVIDERS
    .filter(provider => !category || provider.category === category)
    .filter(provider => !recommendedOnly || provider.recommended)
    .map(provider => ({
      ...provider,
      configured: configuredProvider(provider),
      readiness: readiness(provider)
    }))
    .sort((a, b) => b.fitScore - a.fitScore);

  return {
    providers,
    summary: {
      total: providers.length,
      recommended: providers.filter(provider => provider.recommended).length,
      configured: providers.filter(provider => provider.configured).length,
      reviewRequired: providers.filter(provider => provider.readiness === 'review-required').length,
      byCategory: categoryCounts(providers)
    }
  };
}

export function getProviderCatalogItem(providerId) {
  const provider = PROVIDERS.find(item => item.id === providerId);
  if (!provider) return null;
  return {
    ...provider,
    configured: configuredProvider(provider),
    readiness: readiness(provider)
  };
}

export function getProviderSetup(providerId) {
  const provider = getProviderCatalogItem(providerId);
  if (!provider) return null;

  const setup = {
    providerId: provider.id,
    readiness: provider.readiness,
    env: envStatus(provider),
    checklist: buildChecklist(provider),
    workerManifest: {
      schemaVersion: 'provider-worker/v1',
      providerId: provider.id,
      category: provider.category,
      setupMode: provider.setupMode,
      commandTemplate: provider.workerCommand,
      inputs: provider.workerInputs,
      outputs: provider.outputContract,
      sampleRequest: sampleRequest(provider)
    },
    nextActions: provider.integrationPlan,
    blockingCautions: provider.cautions
  };

  return { provider, setup };
}
