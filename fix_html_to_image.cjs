const fs = require('fs');

let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

// Replace the download wrapper logic
code = code.replace(
    /const originalParentWidth = canvasWrapperRef\.current \? canvasWrapperRef\.current\.style\.width : '';\s*const originalParentHeight = canvasWrapperRef\.current \? canvasWrapperRef\.current\.style\.height : '';\s*if \(canvasWrapperRef\.current\) \{\s*canvasWrapperRef\.current\.style\.width = `\$\{baseDim\.width\}px`;\s*canvasWrapperRef\.current\.style\.height = `\$\{baseDim\.height\}px`;\s*\}/g,
    `const originalParentWidth = canvasWrapperRef.current ? canvasWrapperRef.current.style.width : '';
    const originalParentHeight = canvasWrapperRef.current ? canvasWrapperRef.current.style.height : '';
    const originalParentPosition = canvasWrapperRef.current ? canvasWrapperRef.current.style.position : '';
    const originalParentZIndex = canvasWrapperRef.current ? canvasWrapperRef.current.style.zIndex : '';
    
    if (canvasWrapperRef.current) {
      canvasWrapperRef.current.style.width = \`\${baseDim.width}px\`;
      canvasWrapperRef.current.style.height = \`\${baseDim.height}px\`;
      canvasWrapperRef.current.style.position = 'fixed';
      canvasWrapperRef.current.style.left = '0';
      canvasWrapperRef.current.style.top = '0';
      canvasWrapperRef.current.style.zIndex = '-9999';
    }`
);

code = code.replace(
    /if \(canvasWrapperRef\.current\) \{\s*canvasWrapperRef\.current\.style\.width = originalParentWidth;\s*canvasWrapperRef\.current\.style\.height = originalParentHeight;\s*\}/g,
    `if (canvasWrapperRef.current) {
        canvasWrapperRef.current.style.width = originalParentWidth;
        canvasWrapperRef.current.style.height = originalParentHeight;
        canvasWrapperRef.current.style.position = originalParentPosition;
        canvasWrapperRef.current.style.left = '';
        canvasWrapperRef.current.style.top = '';
        canvasWrapperRef.current.style.zIndex = originalParentZIndex;
      }`
);

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
