// Generate gradient from selected color(s)
export const generateGradient = (color1, color2 = null) => {
  if (!color2) {
    // Single color mode - create darker version for gradient
    const hex = color1.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Create darker version for gradient - increased contrast for more visibility
    const darkerR = Math.max(0, r - 80);
    const darkerG = Math.max(0, g - 80);
    const darkerB = Math.max(0, b - 80);
    
    const darkerColor = `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
    
    return `linear-gradient(135deg, ${color1} 0%, ${darkerColor} 100%)`;
  } else {
    // Dual color mode - create gradient between two selected colors
    return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
  }
}; 