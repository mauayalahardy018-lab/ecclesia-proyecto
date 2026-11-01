// Identidad y ubicación de templos reales. Los demás datos del seed son simulados.
// Fuentes: arquidiócesis, gobiernos e inventarios culturales; Maps abre la ficha externa con fotos.
const yucatan = "https://www.yucatan.gob.mx/estado/ver_municipio.php?id=50";
const puebla = "https://sic.cultura.gob.mx/documentos/1817.pdf";
const tehuacan = "https://sic.cultura.gob.mx/lista.php?estado_id=21&municipio_id=156&table=monumento_icahe";
const guadalajara = "https://arquidiocesisgdl.org/horario2.php";
const tlajomulco = "https://sc.jalisco.gob.mx/sites/sc.jalisco.gob.mx/files/13defiestapj.pdf";

function church(name, type, localityCode, address, sourceUrl, facts = {}) {
  return {
    name,
    type,
    localityCode,
    address,
    sourceUrl,
    mapsQuery: `${name}, ${address}, México`,
    ...facts
  };
}

export const realChurches = [
  church(
    "Catedral de San Ildefonso",
    "catedral",
    "310500001",
    "Calle 60 esquina 61, Centro, Mérida, Yucatán",
    "https://sic.cultura.gob.mx/ficha.php?table=catedral&table_id=80"
  ),
  church("Iglesia de Santa Ana", "templo", "310500001", "Barrio de Santa Ana, Mérida, Yucatán", yucatan),
  church(
    "Iglesia de Santa Lucía",
    "templo",
    "310500001",
    "Centro, Mérida, Yucatán",
    "https://www.sefotur.yucatan.gob.mx/files-content/general/3b6a0016f39669e0a7990758f065cd10.pdf"
  ),
  church("Iglesia de San Cristóbal", "templo", "310500001", "Barrio de San Cristóbal, Mérida, Yucatán", yucatan),
  church("Iglesia de San Sebastián", "templo", "310500001", "Barrio de San Sebastián, Mérida, Yucatán", yucatan),
  church("Iglesia de San Juan Bautista", "templo", "310500001", "Barrio de San Juan, Mérida, Yucatán", yucatan),
  church("Iglesia de Jesús de la Tercera Orden", "templo", "310500001", "Centro, Mérida, Yucatán", yucatan),
  church(
    "Ermita de Santa Isabel",
    "capilla",
    "310500001",
    "Calle 77 esquina 66, Mérida, Yucatán",
    "https://sic.cultura.gob.mx/documentos/1810.pdf"
  ),
  church(
    "Parroquia de San Juan Bautista",
    "parroquia",
    "310790001",
    "Tekax de Álvaro Obregón, Yucatán",
    "https://arquidiocesisdeyucatan.org.mx/arquidiocesis-de-yucatan/nombramientos-arquidiocesis-de-yucatan-julio-2023/"
  ),
  church(
    "Iglesia de San Servacio",
    "parroquia",
    "311020001",
    "Centro, Valladolid, Yucatán",
    "https://www.yucatan.gob.mx/estado/ver_municipio.php?id=102"
  ),

  church("Catedral de Puebla", "catedral", "211140001", "16 de Septiembre entre 3 y 5 Oriente, Centro, Puebla", puebla),
  church(
    "Iglesia de Santo Domingo",
    "templo",
    "211140001",
    "5 de Mayo entre 4 y 8 Poniente, Centro, Puebla",
    "https://sic.cultura.gob.mx/ficha.php?table=monumento_icahe&table_id=2002"
  ),
  church(
    "Templo de San Francisco",
    "templo",
    "211140001",
    "Bulevar Héroes del 5 de Mayo y 14 Oriente, Puebla",
    "https://sic.cultura.gob.mx/ficha.php?table=monumento_icahe&table_id=1999"
  ),
  church(
    "Templo de la Compañía",
    "templo",
    "211140001",
    "4 Sur esquina Avenida Maximino Ávila Camacho, Puebla",
    puebla
  ),
  church(
    "Templo del Carmen",
    "templo",
    "211140001",
    "16 de Septiembre 1704, Centro, Puebla",
    "https://sic.cultura.gob.mx/ficha.php?table=monumento_icahe&table_id=1281"
  ),
  church("Templo de San Agustín", "templo", "211140001", "5 Sur entre 3 y 5 Poniente, Centro, Puebla", puebla),
  church("Templo de la Merced", "templo", "211140001", "5 Norte 1001 esquina 10 Poniente, Puebla", puebla),
  church("Templo de Santa Clara", "templo", "211140001", "6 Oriente 201 esquina 2 Norte, Puebla", puebla),
  church(
    "Catedral de la Inmaculada Concepción de Tehuacán",
    "catedral",
    "211560001",
    "1 Oriente s/n, Centro, Tehuacán, Puebla",
    tehuacan
  ),
  church(
    "Parroquia de Nuestra Señora del Carmen",
    "parroquia",
    "211560001",
    "Reforma Norte s/n, Centro, Tehuacán, Puebla",
    tehuacan
  ),
  church(
    "Parroquia de Santa María Magdalena",
    "parroquia",
    "211560001",
    "Juárez s/n, Centro, Tehuacán, Puebla",
    tehuacan
  ),
  church("Parroquia de San Lorenzo Mártir", "parroquia", "211560001", "Agustín Melgar s/n, Tehuacán, Puebla", tehuacan),
  church("Templo El Calvario", "templo", "211560001", "3 Sur s/n, Centro, Tehuacán, Puebla", tehuacan),
  church("Templo de San Diego Alcalá", "templo", "211560001", "Nacional s/n, Centro, Tehuacán, Puebla", tehuacan),
  church("Capilla del Refugio", "capilla", "211560001", "3 Poniente 121, Centro, Tehuacán, Puebla", tehuacan),
  church(
    "Parroquia de Santa María de la Asunción",
    "parroquia",
    "210010001",
    "Plaza de la Constitución 1, Barrio La Virgen, Acajete, Puebla",
    "https://sic.cultura.gob.mx/ficha.php?table=monumento_icahe&table_id=2105"
  ),

  church(
    "Catedral Basílica de la Asunción de María",
    "basilica",
    "140390001",
    "Av. Fray Antonio Alcalde 10, Centro, Guadalajara, Jalisco",
    "https://sic.cultura.gob.mx/ficha.php?table=catedral&table_id=40",
    {
      legacyName: "Parroquia de San Bernardo",
      constructionYear: 1561,
      phone: "33 3614 5504",
      email: "catedralbasilicagdl@gmail.com"
    }
  ),
  church("Parroquia de El Calvario", "parroquia", "140390001", "Guadalajara, Jalisco", guadalajara),
  church("Parroquia de San Francisco de Asís", "parroquia", "140390001", "Guadalajara, Jalisco", guadalajara),
  church("Parroquia de Corpus Christi", "parroquia", "140390001", "Guadalajara, Jalisco", guadalajara),
  church("Parroquia de la Santa Cruz", "parroquia", "140390001", "Guadalajara, Jalisco", guadalajara),
  church("Parroquia Dulce Nombre de Jesús", "parroquia", "140390001", "Guadalajara, Jalisco", guadalajara),
  church("Parroquia del Espíritu Santo", "parroquia", "140390001", "Guadalajara, Jalisco", guadalajara),
  church("Parroquia de San José de Analco", "parroquia", "140390001", "Guadalajara, Jalisco", guadalajara),
  church("Parroquia de San Juan de Dios", "parroquia", "140390001", "Guadalajara, Jalisco", guadalajara),
  church("Parroquia del Sagrario Metropolitano", "parroquia", "140390001", "Guadalajara, Jalisco", guadalajara),
  church(
    "Parroquia de San Antonio de Padua",
    "parroquia",
    "140970001",
    "Juárez Norte 24, Tlajomulco de Zúñiga, Jalisco",
    "https://www.tlajomulco.gob.mx/parroquia-de-san-antonio-de-padua"
  ),
  church("Templo de San Martín de Porres", "templo", "140970001", "Tlajomulco de Zúñiga, Jalisco", tlajomulco),
  church("Santuario de la Purísima Concepción", "santuario", "140970001", "Tlajomulco de Zúñiga, Jalisco", tlajomulco),
  church("Templo de la Virgen de Guadalupe", "templo", "140970001", "Tlajomulco de Zúñiga, Jalisco", tlajomulco)
];
