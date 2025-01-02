export const initFaviconChange = () => {
  const favicon = document.getElementById("favicon") as HTMLLinkElement;
  let isOriginal = true;

  const createFaviconSVG = async (phase: number) => {
    // Cargar la imagen del favicon usando una ruta absoluta
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "https://images.squarespace-cdn.com/content/v1/5f1b0ff6550a4d7d70797c8a/3eee20a7-19b4-4c08-a28e-c55b54d93433/favicon.ico";

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => {
        console.error('Error loading favicon image');
        reject(new Error('Failed to load image'));
      };
    });

    const svg = `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mainGrad" x1="0" y1="0" x2="32" y2="32">
            <stop offset="0%" stop-color="#003876" />
            <stop offset="100%" stop-color="#0055B8" />
          </linearGradient>
        </defs>

        <!-- Estado original (imagen) -->
        <g style="opacity: ${isOriginal ? 1 : 0}">
          <image 
            href="${img.src}" 
            width="32" 
            height="32" 
            preserveAspectRatio="xMidYMid slice"
            crossorigin="anonymous"
          />
        </g>

        <!-- Estado KOREI -->
        <g style="opacity: ${isOriginal ? 0 : 1}">
          <!-- White background -->
          <rect width="32" height="32" fill="white"/>
          
          <!-- KOREI text - simplified and smaller -->
          <path
            d="
              M6 8 L6 24 L8 24 L8 17 L11 24 L13 24 L9.5 16 L13 8 L11 8 L8 15 L8 8 Z
              
              M15 8 Q17 8 18 9.25 Q19 10.5 19 13.5 Q19 16.5 18 17.75 Q17 19 15 19 Q13 19 12 17.75 Q11 16.5 11 13.5 Q11 10.5 12 9.25 Q13 8 15 8 Z
              M15 10 Q14 10 13.5 10.75 Q13 11.5 13 13.5 Q13 15.5 13.5 16.25 Q14 17 15 17 Q16 17 16.5 16.25 Q17 15.5 17 13.5 Q17 11.5 16.5 10.75 Q16 10 15 10 Z
              
              M21 8 L21 24 L23 24 L23 17 L24 17 L26 24 L28 24 L26 17 Q27 16.5 27.5 15.5 Q28 14.5 28 13.5 Q28 12 27.5 11.5 Q27 11 26 11 Z
              M23 10 L24 10 Q25 10 25.5 10.5 Q26 11 26 12 Q26 13 25.5 13.5 Q25 14 24 14 L23 14 Z
              
              M29 8 L29 24 L34 24 L34 22 L31 22 L31 17 L33.5 17 L33.5 15 L31 15 L31 10 L34 10 L34 8 Z
              
              M35 12 L35 24 L37 24 L37 12 Z
              M35 8 L35 10 L37 10 L37 8 Z
            "
            fill="#1B275E"
            stroke="#1B275E"
            stroke-width="0.3"
            stroke-linejoin="round"
          />
        </g>
      </svg>
    `;

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    return URL.createObjectURL(blob);
  };

  const updateFavicon = async () => {
    try {
      // Si estamos en el estado original, primero aseguramos que la imagen ICO se cargue
      if (isOriginal) {
        favicon.href = "https://images.squarespace-cdn.com/content/v1/5f1b0ff6550a4d7d70797c8a/3eee20a7-19b4-4c08-a28e-c55b54d93433/favicon.ico";
        await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa
      } else {
        const newFaviconUrl = await createFaviconSVG(1);
        if (newFaviconUrl) {
          const oldUrl = favicon.href;
          favicon.href = newFaviconUrl;
          
          setTimeout(() => {
            if (oldUrl.startsWith('blob:')) {
              URL.revokeObjectURL(oldUrl);
            }
          }, 100);
        }
      }
      
      isOriginal = !isOriginal;
    } catch (error) {
      console.error('Error updating favicon:', error);
    }
  };

  // Iniciar el ciclo
  updateFavicon();
  const intervalId = setInterval(updateFavicon, 3000);

  return () => {
    clearInterval(intervalId);
    if (favicon.href.startsWith('blob:')) {
      URL.revokeObjectURL(favicon.href);
    }
  };
}; 