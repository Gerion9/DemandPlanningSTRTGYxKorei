export const initFaviconChange = () => {
  const favicon = document.getElementById("favicon") as HTMLLinkElement;
  
  // Precargar las imágenes para evitar parpadeos
  const koreiIcon = new Image();
  koreiIcon.src = "https://www.korei.mx/favicon.png";
  
  const strtgyIcon = new Image();
  strtgyIcon.src = "https://images.squarespace-cdn.com/content/v1/5f1b0ff6550a4d7d70797c8a/3eee20a7-19b4-4c08-a28e-c55b54d93433/favicon.ico";
  
  let isKorei = true;

  const updateFavicon = () => {
    // Asignar directamente sin async/await para evitar estados intermedios
    favicon.href = isKorei 
      ? "https://www.korei.mx/favicon.png"
      : "https://images.squarespace-cdn.com/content/v1/5f1b0ff6550a4d7d70797c8a/3eee20a7-19b4-4c08-a28e-c55b54d93433/favicon.ico";
    
    isKorei = !isKorei;
  };

  // Establecer favicon inicial
  favicon.href = "https://www.korei.mx/favicon.png";
  
  // Iniciar el ciclo
  const intervalId = setInterval(updateFavicon, 3000);

  return () => {
    clearInterval(intervalId);
  };
};