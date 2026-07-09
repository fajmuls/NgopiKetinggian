const fs = require('fs');

let code = fs.readFileSync('src/admin/TripPosterGenerator.tsx', 'utf8');

// 1. Remove postCategory usage, we will use layout.
code = code.replace(
    /type PostCategory = 'kreator' \| 'info' \| 'iklan' \| 'bendera' \| 'papan';\s*const \[postCategory, setPostCategory\] = useState<PostCategory>\('kreator'\);/,
    "// removed postCategory"
);

code = code.replace(
    /useEffect\(\(\) => \{\s*switch \(postCategory\) \{[\s\S]*?\}\s*\}, \[postCategory\]\);/,
    `useEffect(() => {
    switch (layout) {
      case 'poster':
        setSelectedSlides(['poster']);
        break;
      case 'rundown': // Info
        setSelectedSlides(['poster', 'rundown', 'gears', 'rules', 'ad']);
        break;
      case 'ad': // Iklan
        setSelectedSlides(['ad', 'rundown', 'promo']); // 3 slides for Iklan
        break;
      case 'flag': // Bendera
        setSelectedSlides(['flag']);
        break;
      case 'board': // Papan
        setSelectedSlides(['board']);
        break;
    }
    setCurrentSlide(0);
  }, [layout]);`
);

// We need a currentSlide index instead of horizontal scrolling to show one slide at a time
if (!code.includes('const [currentSlide, setCurrentSlide] = useState(0)')) {
   code = code.replace(
      /const \[selectedSlides, setSelectedSlides\] = useState<string\[\]>\(\['poster'\]\);/,
      `const [selectedSlides, setSelectedSlides] = useState<string[]>(['poster']);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [posterDesign, setPosterDesign] = useState<number>(1);
  const [flagShowLogo, setFlagShowLogo] = useState(true);
  const [flagShowMountain, setFlagShowMountain] = useState(true);
  const [boardShowMountain, setBoardShowMountain] = useState(true);`
   );
}

fs.writeFileSync('src/admin/TripPosterGenerator.tsx', code);
