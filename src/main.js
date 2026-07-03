/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
   const { discount, sale_price, quantity } = purchase;
   const discountChanged = discount / 100;
   const revenue = (sale_price * quantity) * (1 - discountChanged);
   return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

    const lastIndex = total - 1;

    if (index === 0) {
        return profit * 0.15;
    } else if (index===2 || index===1) {
        return profit * 0.1;
    } else if (index === lastIndex) {
        return 0;
    } else {
        return profit * 0.05;
    }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    const { calculateRevenue, calculateBonus } = options;

    if (!data || !Array.isArray(data.sellers) || !Array.isArray(data.products) || !Array.isArray(data.purchase_records)) {
        throw new Error('Данные некорректны');
    }

    if (data.sellers.length === 0 || data.products.length === 0 ||data.purchase_records.length === 0) {
        throw new Error('Данные пустые');
    }
    
    // @TODO: Проверка наличия опций
    if (!options || typeof calculateRevenue !== "function" || typeof calculateBonus !== "function") {
        throw new Error("Переменные не являются функциями!");
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellersData = data.sellers.map(seller => (
        {
          seller_id: seller.id,
          name: `${seller.first_name} ${seller.last_name}`,
          revenue: 0,
          profit: 0,
          sales_count: 0,
          products_sold: {},
        }
    ));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const indexSellers = Object.fromEntries(sellersData.map(seller => [seller.seller_id, seller]));
    const indexProducts = Object.fromEntries(data.products.map(product => [product.sku, product]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(({ seller_id, items, total_amount }) => {
    const sellerPersonal = indexSellers[seller_id];
    if (!sellerPersonal) return;
    sellerPersonal.sales_count += 1;
    sellerPersonal.revenue += total_amount;
    const profitFromCheck = items.reduce((accum, item) => 
        {
            const product = indexProducts[item.sku];
            if (!product) return accum;
            const revenue = calculateRevenue(item, product);
            const cost = product.purchase_price * item.quantity;
            return accum + (revenue - cost);
        }, 0);
    sellerPersonal.profit += profitFromCheck;
    items.forEach(({ sku, quantity }) => {
        sellerPersonal.products_sold[sku] = (sellerPersonal.products_sold[sku] || 0) + quantity;});
    });

    // @TODO: Сортировка продавцов по прибыли
    sellersData.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    const totalSellers = sellersData.length;
    sellersData.forEach((seller, index) => {
    seller.bonus = calculateBonusByProfit(index, totalSellers, seller);
    const topProducts = Object.entries(seller.products_sold)
        .map(([sku, quantity]) => ({ sku, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    seller.top_products = topProducts;});

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellersData.map(seller => (
        {
            seller_id: seller.seller_id,
            name: seller.name,
            revenue: +seller.revenue.toFixed(2),
            profit: +seller.profit.toFixed(2),
            sales_count: seller.sales_count,
            top_products: seller.top_products,
            bonus: +seller.bonus.toFixed(2)
        }
    )
);
}
