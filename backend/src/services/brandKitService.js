const brandKits = new Map();

const DEFAULT_BRAND_KIT = {
  id: 'default_creator_brand',
  name: 'Creator Default Brand',
  logoUrl: '',
  primaryColor: '#7c3aed',
  secondaryColor: '#22c55e',
  accentColor: '#f97316',
  fontFamily: 'Inter',
  subtitleStyle: {
    textColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.65)',
    position: 'bottom',
    fontSize: 54
  },
  watermark: {
    enabled: true,
    text: 'AI Avatar Studio',
    position: 'top-right'
  },
  createdAt: new Date().toISOString()
};

export function getBrandKit(ownerId) {
  if (!brandKits.has(ownerId)) {
    brandKits.set(ownerId, { ...DEFAULT_BRAND_KIT, ownerId });
  }
  return brandKits.get(ownerId);
}

export function updateBrandKit(ownerId, input = {}) {
  const current = getBrandKit(ownerId);
  const updated = {
    ...current,
    name: input.name || current.name,
    logoUrl: input.logoUrl ?? current.logoUrl,
    primaryColor: input.primaryColor || current.primaryColor,
    secondaryColor: input.secondaryColor || current.secondaryColor,
    accentColor: input.accentColor || current.accentColor,
    fontFamily: input.fontFamily || current.fontFamily,
    subtitleStyle: {
      ...current.subtitleStyle,
      ...(input.subtitleStyle || {})
    },
    watermark: {
      ...current.watermark,
      ...(input.watermark || {})
    },
    updatedAt: new Date().toISOString()
  };

  brandKits.set(ownerId, updated);
  return updated;
}

export function applyBrandToRenderPayload(renderPayload = {}, brandKit = DEFAULT_BRAND_KIT) {
  return {
    ...renderPayload,
    brandKit: {
      id: brandKit.id,
      name: brandKit.name,
      logoUrl: brandKit.logoUrl,
      colors: {
        primary: brandKit.primaryColor,
        secondary: brandKit.secondaryColor,
        accent: brandKit.accentColor
      },
      fontFamily: brandKit.fontFamily,
      subtitleStyle: brandKit.subtitleStyle,
      watermark: brandKit.watermark
    }
  };
}
