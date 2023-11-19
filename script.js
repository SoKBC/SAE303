// Chemin vers le fichier de données JSON
const fileToFetch = "openfoodfacts-bonbons.json";

// Sélection des éléments HTML à afficher et à utiliser
const display1 = document.querySelector("#display1");
const display2 = document.querySelector("#display2");
const input1 = document.getElementById("input1");
const input2 = document.getElementById("input2");

// Fonction asynchrone pour récupérer les données depuis le fichier JSON
const getData = async () => {
    const response = await fetch(fileToFetch);
    const data = await response.json();
    return data;
};

// Déclarations des variables pour les graphiques
let myChart;
let topBrandsChart;
let categoryPieChart;

// Map pour faire correspondre les étiquettes nutritionnelles avec des noms compréhensibles
const nutritionalLabelsMap = {
    kcal: 'kcal',
    fat: 'lipides',
    'saturatedFat': 'acides gras saturés',
    carbohydrates: 'glucides',
    sugars: 'sucres',
    proteins: 'protéines',
    sodium: 'sodium',
};

// Fonction pour créer le graphique des meilleures marques
const createTopBrandsChart = (data) => {
    if (topBrandsChart) {
        topBrandsChart.destroy();
    }

    // Calcul des données des meilleures marques
    const brandsData = data.reduce((acc, product) => {
        const brand = product.brands;
        acc[brand] = (acc[brand] || 0) + 1;
        return acc;
    }, {});

    // Tri des marques par nombre de produits et sélection des 5 meilleures
    const sortedBrands = Object.keys(brandsData).sort((a, b) => brandsData[b] - brandsData[a]);
    const top5Brands = sortedBrands.slice(0, 5);
    const labels = top5Brands.map(brand => brand || 'Inconnu');
    const dataPoints = top5Brands.map(brand => brandsData[brand]);

    // Création du graphique des meilleures marques
    const ctx = document.getElementById('topBrandsChart').getContext('2d');
    topBrandsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nombre de produits',
                data: dataPoints,
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        color: 'white', // Couleur du texte de l'axe y
                    },
                },
                x: {
                    ticks: {
                        color: 'white', // Couleur du texte de l'axe x
                    },
                },
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'white', // Couleur du texte de la légende
                    },
                },
            },
        },
    });
};

// Fonction pour créer le graphique de comparaison des produits
const createComparisonChart = (data1, data2) => {
    if (myChart) {
        myChart.destroy();
    }

    // Filtrage des étiquettes nutritionnelles et des catégories
    const nutritionalLabels = Object.keys(data1).filter(label => label !== 'energy');
    const filteredLabels = nutritionalLabels.filter(label => {
        if (label === 'salt') {
            return data1.sodium !== null;
        }
        return true;
    });

    // Création des jeux de données pour les produits à comparer
    const datasets = [
        {
            label: (nutritionalLabelsMap[input1.value] || input1.value).charAt(0).toUpperCase() + (nutritionalLabelsMap[input1.value] || input1.value).slice(1),
            data: Object.values(data1).filter((_, index) => index !== nutritionalLabels.indexOf('energy')),
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
        },
        {
            label: (nutritionalLabelsMap[input2.value] || input2.value).charAt(0).toUpperCase() + (nutritionalLabelsMap[input2.value] || input2.value).slice(1),
            data: Object.values(data2).filter((_, index) => index !== nutritionalLabels.indexOf('energy')),
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
        },
    ];

    // Calcul du maximum de calories pour l'axe y
    const maxKcal = Math.max(data1.kcal, data2.kcal);

    // Création du graphique de comparaison
    const ctx = document.getElementById('myChart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: filteredLabels.map(label => nutritionalLabelsMap[label] || label),
            datasets: datasets,
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: maxKcal,
                    ticks: {
                        callback: function (value) {
                            return value + 'g';
                        },
                        color: 'white', // Couleur du texte de l'axe y
                    },
                },
                x: {
                    ticks: {
                        color: 'white', // Couleur du texte de l'axe x
                    },
                },
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'white', // Couleur du texte de la légende
                    },
                },
            },
        },
    });
};

// Fonction pour créer le graphique en secteurs des catégories de produits
const createCategoryPieChart = (data) => {
    if (categoryPieChart) {
        categoryPieChart.destroy();
    }

    // Calcul des données des catégories de produits
    const categoriesData = data.reduce((acc, product) => {
        const productCategories = product.categories.split(', ');
        productCategories.forEach(category => {
            acc[category] = (acc[category] || 0) + 1;
        });
        return acc;
    }, {});

    // Filtrage des catégories avec moins de 100 produits
    const filteredCategories = Object.keys(categoriesData).filter(category => categoriesData[category] >= 100);

    // Regroupement des catégories avec moins de 100 produits dans une catégorie "Autres"
    const otherCategoriesCount = Object.keys(categoriesData).reduce((count, category) => {
        if (!filteredCategories.includes(category)) {
            count += categoriesData[category];
        }
        return count;
    }, 0);

    // Préparation des étiquettes et des données pour le graphique en secteurs
    const categoryLabels = [...filteredCategories, 'Autres'];
    const dataPoints = categoryLabels.map(label => (label === 'Autres' && otherCategoriesCount >= 100) ? otherCategoriesCount : categoriesData[label] || 0);

    // Création du graphique en secteurs
    const ctx = document.getElementById('categoryPieChart').getContext('2d');
    categoryPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categoryLabels,
            datasets: [{
                data: dataPoints,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                ],
                borderWidth: 1,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'white', // Couleur du texte de la légende
                    },
                },
            },
        },
    });
};

// Fonction pour obtenir les données nutritionnelles des produits à comparer
const getNutritionalData = (data, productNames) => {
    const nutritionalData = {};

    productNames.forEach((productName) => {
        const product = data.find((item) => item.product_name_fr.toLowerCase() === productName.toLowerCase());

        if (product) {
            nutritionalData[productName] = {
                kcal: product['energy-kcal_value'],
                fat: product['fat_value'],
                'saturatedFat': product['saturated-fat_value'],
                carbohydrates: product['carbohydrates_value'],
                sugars: product['sugars_value'],
                proteins: product['proteins_value'],
                sodium: product['salt_value'] !== 0 ? product['salt_value'] : (product['sodium_value'] !== 0 ? product['sodium_value'] : null),
            };
        } else {
            console.error(`Le produit ${productName} n'a pas été trouvé dans les données.`);
        }
    });

    return nutritionalData;
};

// Fonction pour afficher les informations des produits
const displayStuff = async () => {
    // Récupération des valeurs de recherche
    let query1 = input1.value;
    let query2 = input2.value;

    console.log("Query 1:", query1);
    console.log("Query 2:", query2);

    // Récupération des données depuis le fichier JSON
    const payload = await getData();

    // Création du HTML pour afficher les informations des produits
    let dataDisplay1 = `
        <div class="product-list">
            ${payload
                .filter((eventData) => query1 === "" || eventData.product_name_fr.toLowerCase().includes(query1.toLowerCase()))
                .map((object) => {
                    const { product_name_fr, brands } = object;
                    return `
                        <div class="container">
                            <p class="paraList">Produit: ${product_name_fr}</p>
                            <p class="paraList">Marque: ${brands}</p>
                        </div>
                    `;
                })
                .join("")}
        </div>
    `;

    let dataDisplay2 = `
        <div class="product-list">
            ${payload
                .filter((eventData) => query2 === "" || eventData.product_name_fr.toLowerCase().includes(query2.toLowerCase()))
                .map((object) => {
                    const { product_name_fr, brands } = object;
                    return `
                        <div class="container">
                            <p class ="paraList">Produit: ${product_name_fr}</p>
                            <p class ="paraList">Marque: ${brands}</p>
                        </div>
                    `;
                })
                .join("")}
        </div>
    `;

    // Affichage des informations des produits
    display1.innerHTML = dataDisplay1;
    display2.innerHTML = dataDisplay2;

    // Récupération des données nutritionnelles des produits à comparer
    const productsToCompare = [query1, query2];
    const nutritionalData = getNutritionalData(payload, productsToCompare);

    // Création du graphique de comparaison
    createComparisonChart(nutritionalData[query1], nutritionalData[query2]);
};

// Appel initial pour afficher les données
displayStuff();

// Ajout des écouteurs d'événements pour les champs de recherche
input1.addEventListener("input", displayStuff);
input2.addEventListener("input", displayStuff);

// Récupération des données JSON et création des graphiques
getData().then((jsonData) => {
    createTopBrandsChart(jsonData);
    createCategoryPieChart(jsonData);
});
