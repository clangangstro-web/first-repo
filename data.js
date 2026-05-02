// ========== CAMEROON REGIONS AND CITIES DATA ==========
const CAMEROON_DATA = {
    regions: [
        {
            name: "Littoral",
            cities: ["Douala", "Nkongsamba", "Loum", "Manjo", "Melong", "Yabassi", "Dibombari", "Mbanga"]
        },
        {
            name: "Centre",
            cities: ["Yaoundé", "Mbalmayo", "Obala", "Monatélé", "Nanga Eboko", "Ngoumou", "Okola", "Essé"]
        },
        {
            name: "North",
            cities: ["Garoua", "Lagdo", "Poli", "Tcholliré", "Rey Bouba", "Figuil"]
        },
        {
            name: "Far North",
            cities: ["Maroua", "Mokolo", "Kousséri", "Yagoua", "Mora", "Kaélé", "Bogo", "Kolofata"]
        },
        {
            name: "Adamawa",
            cities: ["Ngaoundéré", "Tibati", "Bélel", "Meiganga", "Ngaoui", "Bankim"]
        },
        {
            name: "East",
            cities: ["Bertoua", "Batouri", "Bélabo", "Abong-Mbang", "Yokadouma", "Dimako", "Doumé"]
        },
        {
            name: "South",
            cities: ["Ebolowa", "Mbalmayo", "Ambam", "Kribi", "Sangmélima", "Olama", "Mvangan"]
        },
        {
            name: "South-West",
            cities: ["Buea", "Limbe", "Kumba", "Tiko", "Muyuka", "Mamfe", "Fontem", "Bangem"]
        },
        {
            name: "North-West",
            cities: ["Bamenda", "Kumbo", "Bafut", "Ndop", "Nkambe", "Wum", "Batibo", "Mbengwi"]
        },
        {
            name: "West",
            cities: ["Bafoussam", "Bangangté", "Dschang", "Foumban", "Mbouda", "Baham", "Bali", "Bandjoun"]
        }
    ]
};

// Preload zones for major cities (can be extended by users)
const PRELOADED_ZONES = {
    "Douala": ["Bonapriso", "Bonaberi", "Yassa", "Akwa", "Deido", "New Bell", "Makepe", "Logbessou", "Bonamoussadi", "Bepanda", "Ndogpassi", "Japoma"],
    "Yaoundé": ["Bastos", "Mvog-Mbi", "Mokolo", "Elig-Effa", "Messa", "Etoudi", "Nlongkak", "Mfoundi", "Biyeem-Assi", "Mvolyé"],
    "Garoua": ["Roumdé Adjia", "Pitoa", "Camp L'Ami", "Domayo", "Fignole", "Djamboutou"],
    "Maroua": ["Domayo", "Palar", "Doualaré", "Médine", "Petté", "Makabaye"],
    "Buea": ["Molyko", "Bokova", "Great Soppo", "Bonduma", "Mile 15", "Bova", "Bomaka"],
    "Limbe": ["Down Beach", "Mile 2", "Mile 4", "Batoke", "Idenau", "Bakingili", "Bota"]
};