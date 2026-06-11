const FLAG_MAP = {
  // Group A
  "México": "🇲🇽",
  "Sudáfrica": "🇿🇦",
  "Corea del Sur": "🇰🇷",
  "Chequia": "🇨🇿",
  
  // Group B
  "Canadá": "🇨🇦",
  "Bosnia y Herzegovina": "🇧🇦",
  "Qatar": "🇶🇦",
  "Suiza": "🇨🇭",
  
  // Group C
  "Brasil": "🇧🇷",
  "Marruecos": "🇲🇦",
  "Haití": "🇭🇹",
  "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  
  // Group D
  "Estados Unidos": "🇺🇸",
  "Paraguay": "🇵🇾",
  "Australia": "🇦🇺",
  "Turquía": "🇹🇷",
  
  // Group E
  "Alemania": "🇩🇪",
  "Curazao": "🇨🇼",
  "Costa de Marfil": "🇨🇮",
  "Ecuador": "🇪🇨",
  
  // Group F
  "Francia": "🇫🇷",
  "Japón": "🇯🇵",
  "Suecia": "🇸🇪",
  "Túnez": "🇹🇳",
  
  // Group G
  "Argentina": "🇦🇷",
  "Irán": "🇮🇷",
  "Chile": "🇨🇱",
  "Polonia": "🇵🇱",
  
  // Group H
  "España": "🇪🇸",
  "Argelia": "🇩🇿",
  "Perú": "🇵🇪",
  "Ucrania": "🇺🇦",
  
  // Group I
  "Portugal": "🇵🇹",
  "Egipto": "🇪🇬",
  "Nueva Zelanda": "🇳🇿",
  "Rumania": "🇷🇴",
  
  // Group J
  "Italia": "🇮🇹",
  "Camerún": "🇨🇲",
  "Venezuela": "🇻🇪",
  "Arabia Saudita": "🇸🇦",
  
  // Group K
  "Bélgica": "🇧🇪",
  "Senegal": "🇸🇳",
  "Costa Rica": "🇨🇷",
  "Noruega": "🇳🇴",
  
  // Group L
  "Inglaterra": "🏴\u200d󠁡󠁲󠁥󠁮󠁧󠁿", // England flag emoji
  "Croacia": "🇭🇷",
  "Ghana": "🇬🇭",
  "Panamá": "🇵🇦"
};

export function getFlag(teamName) {
  if (!teamName) return "⚽";
  
  // Check direct matches
  if (FLAG_MAP[teamName]) {
    return FLAG_MAP[teamName];
  }
  
  // Check substring matches (e.g. "Inglaterra" in "Ganador Inglaterra")
  for (const team in FLAG_MAP) {
    if (teamName.toLowerCase().includes(team.toLowerCase())) {
      return FLAG_MAP[team];
    }
  }
  
  return "⚽"; // Default icon for placeholders like "Ganador R32-1" or unknown teams
}
