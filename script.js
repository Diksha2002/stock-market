const Stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'PYPL', 'TSLA', 'JPM', 'NVDA', 'NFLX', 'DIS'];
let currentStock = null;
let chart = null;

document.addEventListener('DOMContentLoaded', () => {
    renderStockList(Stocks);
    // Set default stock and range on page load
    handleStockClick(Stocks[0], '1mo');
});

async function renderStockList(stocks) {
    const stockList = document.getElementById('stockList');
    stockList.innerHTML = '';

    for (const stock of stocks) {
        const statsData = await fetchStockStats(stock);
        
        // Calculate profit percentage
        const bookValue = statsData.bookValue || 1; // Avoid division by zero
        const profitValue = statsData.profit || 0;
        const profitPercentage = ((profitValue / bookValue) * 100).toFixed(2); // Round to 2 decimals

        const stockItem = document.createElement('div');
        stockItem.className = 'stock-item';

        const button = document.createElement('button');
        button.textContent = stock;

        const bookValueElement = document.createElement('span');
        bookValueElement.textContent = `$${bookValue}`;

        const profitValueElement = document.createElement('span');
        profitValueElement.textContent = `${profitPercentage}%`; // Display profit as percentage

        button.onclick = async () => {
            await handleStockClick(stock, '1mo'); // Default range
        };

        stockItem.appendChild(button);
        stockItem.appendChild(bookValueElement);
        stockItem.appendChild(profitValueElement);
        stockList.appendChild(stockItem);
    }
}


async function fetchChartData(stock, range) {
    try {
        const response = await fetch(`https://stocks3.onrender.com/api/stocks/getstocksdata`);
        const data = await response.json();
        console.log("API Response:", data);

        const selectedStockData = data.stocksData[0];
        console.log("Selected Stock Data:", selectedStockData);

        if (!selectedStockData) {
            console.error('No stock data found.');
            return null;
        }

        const rangeData = selectedStockData[stock]?.[range];
        console.log("Range Data for", stock, ":", rangeData);

        if (!rangeData) {
            console.error(`No data available for stock ${stock} in range ${range}.`);
            return null;
        }

        if (!Array.isArray(rangeData.value) || !Array.isArray(rangeData.timeStamp)) {
            console.error('Invalid data structure for range data:', rangeData);
            return null;
        }

        return rangeData;
    } catch (error) {
        console.error("Error fetching chart data:", error);
        return null;
    }
}

async function handleStockClick(stock, range = '1mo') {
    currentStock = stock;

    const profileData = await fetchProfileData(stock);
    const statsData = await fetchStockStats(stock);
    const chartData = await fetchChartData(stock, range);

    if (chartData) {
        renderChart(chartData, range);
    } else {
        console.error('No chart data available to render.');
    }

    const bookValue = statsData.bookValue || 'N/A';
    const profitValue = statsData.profit || 0;
    const profitPercentage = ((profitValue / bookValue) * 100).toFixed(2);

    const stockDetailsElement = document.getElementById('stockDetails');
    const profitColorClass = profitValue > 0 ? 'profit-positive' : 'profit-negative';
    
    // Adjusted spacing
    stockDetailsElement.innerHTML = `<span>${stock}</span> <span class="${profitColorClass}">${profitPercentage}%</span> <span>$${bookValue}</span>`;
    
    // Debug: Log the profit value and class application
    console.log('Profit Value:', profitValue);
    console.log('Stock Details Element:', stockDetailsElement);

    // Set summary text
    document.getElementById('summary').textContent = profileData.summary || 'N/A';
}


function renderChart(chartData, range) {
    const ctx = document.getElementById('stockChart').getContext('2d');

    const labels = chartData.timeStamp.map(ts => new Date(ts * 1000).toLocaleDateString());
    const dataValues = chartData.value;

    // Calculate peak and low values
    const peakValue = Math.max(...dataValues);
    const lowValue = Math.min(...dataValues);

    // Update the peak and low values in the HTML
    document.getElementById('peakValue').textContent = `Peak Value: $${peakValue.toFixed(2)}`;
    document.getElementById('lowValue').textContent = `Low Value: $${lowValue.toFixed(2)}`;

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Stock Price over ${range}`,
                data: dataValues,
                borderColor: 'rgb(72, 50, 72)',
                borderWidth: 2,
                pointRadius: 0, // Hide data points
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    display: false,
                },
                y: {
                    display: false,
                }
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            return `Date: ${labels[tooltipItems[0].dataIndex]}`; // Display date
                        },
                        label: function(tooltipItem) {
                            return `Price: $${tooltipItem.raw}`; // Display price
                        }
                    }
                },
                // ... (annotation plugin configuration)
            },
            interaction: {
                mode: 'nearest',
                intersect: false,
                // ... (hover functionality)
            }
        }
    });
}

async function fetchProfileData(stock) {
    try {
        const response = await fetch(`https://stocks3.onrender.com/api/stocks/getstocksprofiledata?stock=${stock}`);
        const profileData = await response.json();
        console.log(`Profile Data for ${stock}:`, profileData);

        // Ensure the summary is populated correctly
        profileData.summary = profileData.summary || getDefaultSummary(stock);

        return profileData;
    } catch (error) {
        console.error("Error fetching profile data:", error);
        return { summary: getDefaultSummary(stock) };
    }
}

function getDefaultSummary(stock) {
    const summaries = {
        'AAPL': 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. It also offers services, including App Store, Apple Music, Apple Pay, and iCloud. The company was founded in 1977 and is headquartered in Cupertino, California.',
        'MSFT': 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. Its products include operating systems, cross-device productivity applications, server applications, business solution applications, and more. The company was founded in 1975 and is headquartered in Redmond, Washington.',
        'GOOGL': 'Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America. It operates through Google Services, Google Cloud, and Other Bets segments. The company was founded in 1998 and is headquartered in Mountain View, California.',
        'AMZN': 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally. It operates through three segments: North America, International, and Amazon Web Services (AWS). The company was founded in 1994 and is headquartered in Seattle, Washington.',
        'PYPL': 'PayPal Holdings, Inc. operates as a technology platform and digital payments company that enables digital and mobile payments on behalf of consumers and merchants worldwide. The company was founded in 1998 and is headquartered in San Jose, California.',
        'TSLA': 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles and energy generation and storage systems in the United States, China, and internationally. It operates through two segments, Automotive and Energy Generation and Storage. The company was founded in 2003 and is headquartered in Palo Alto, California.',
        'JPM': 'JPMorgan Chase & Co. is a financial holding company, which provides financial and investment banking services. It operates through four segments: Consumer & Community Banking, Corporate & Investment Bank, Commercial Banking, and Asset & Wealth Management. The company was founded in 1799 and is headquartered in New York, New York.',
        'NVDA': 'NVIDIA Corporation operates as a visual computing company worldwide. It operates in two segments: Graphics and Compute & Networking. The Graphics segment offers GPUs for gaming PCs and data centers. The company was founded in 1993 and is headquartered in Santa Clara, California.',
        'NFLX': 'Netflix, Inc. provides subscription streaming entertainment services. It offers TV series, documentaries, and feature films across various genres and languages. The company was founded in 1997 and is headquartered in Los Gatos, California.',
        'DIS': 'The Walt Disney Company, together with its subsidiaries, operates as an entertainment company worldwide. The company operates in two segments: Disney Media and Entertainment Distribution; and Disney Parks, Experiences and Products. It was founded in 1923 and is headquartered in Burbank, California.'
    };
    return summaries[stock] || 'This is a default summary for the selected stock.';
}

async function fetchStockStats(stock) {
    try {
        const response = await fetch(`https://stocks3.onrender.com/api/stocks/getstockstatsdata?stock=${stock}`);
        const data = await response.json();
        console.log(`Stock Stats for ${stock}:`, data);
        return data.stocksStatsData[0][stock];
    } catch (error) {
        console.error("Error fetching stock stats:", error);
        return {};
    }
}

// Add event listeners to range buttons
document.getElementById('range-buttons').addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
        const range = event.target.getAttribute('data-range');
        handleStockClick(currentStock, range);
    }
});




function renderChart(chartData, range) {
    const ctx = document.getElementById('stockChart').getContext('2d');

    const labels = chartData.timeStamp.map(ts => new Date(ts * 1000).toLocaleDateString());
    const dataValues = chartData.value;

    // Calculate peak and low values
    const peakValue = Math.max(...dataValues);
    const lowValue = Math.min(...dataValues);

    // Update the peak and low values in the HTML
    document.getElementById('peakValue').textContent = `Peak Value: $${peakValue.toFixed(2)}`;
    document.getElementById('lowValue').textContent = `Low Value: $${lowValue.toFixed(2)}`;

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Stock Price over ${range}`,
                data: dataValues,
                borderColor: 'rgb(72, 50, 72)',
                borderWidth: 2,
                pointRadius: 0, // Hide data points
                fill: false
            }]
        },
        options: {
            scales: {
                x: {
                    display: false,
                },
                y: {
                    display: false,
                }
            },
            plugins: {
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            return `${labels[tooltipItems[0].dataIndex]}`; // Display date
                        },
                        label: function(tooltipItem) {
                            return `$${tooltipItem.raw}`; // Display price
                        }
                    }
                },
                verticalLine: {
                    display: true,
                    color: 'rgba(255, 0, 0, 0.5)', // Adjust color and opacity
                    width: 2
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false
            }
        }
    });

    // Custom plugin for vertical line
    Chart.register({
        id: 'verticalLine',
        afterDraw: function(chart) {
            const ctx = chart.ctx;
            const x = chart.tooltip._active && chart.tooltip._active[0] ? chart.tooltip._active[0].element.x : null;
            if (x !== null) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, chart.chartArea.top);
                ctx.lineTo(x, chart.chartArea.bottom);
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'; // Line color
                ctx.stroke();
                ctx.restore();
            }
        }
    });
}


async function fetchProfileData(stock) {
    try {
        const response = await fetch(`https://stocks3.onrender.com/api/stocks/getstocksprofiledata?stock=${stock}`);
        const profileData = await response.json();
        console.log(`Profile Data for ${stock}:`, profileData);

        // Ensure the summary is populated correctly
        profileData.summary = profileData.summary || getDefaultSummary(stock);

        return profileData;
    } catch (error) {
        console.error("Error fetching profile data:", error);
        return { summary: getDefaultSummary(stock) };
    }
}

function getDefaultSummary(stock) {
    const summaries = {
        'AAPL': 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. It also offers services, including App Store, Apple Music, Apple Pay, and iCloud. The company was founded in 1977 and is headquartered in Cupertino, California.',
        'MSFT': 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. Its products include operating systems, cross-device productivity applications, server applications, business solution applications, and more. The company was founded in 1975 and is headquartered in Redmond, Washington.',
        'GOOGL': 'Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America. It operates through Google Services, Google Cloud, and Other Bets segments. The company was founded in 1998 and is headquartered in Mountain View, California.',
        'AMZN': 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally. It operates through three segments: North America, International, and Amazon Web Services (AWS). The company was founded in 1994 and is headquartered in Seattle, Washington.',
        'PYPL': 'PayPal Holdings, Inc. operates as a technology platform and digital payments company that enables digital and mobile payments on behalf of consumers and merchants worldwide. The company was founded in 1998 and is headquartered in San Jose, California.',
        'TSLA': 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles and energy generation and storage systems in the United States, China, and internationally. It operates through two segments, Automotive and Energy Generation and Storage. The company was founded in 2003 and is headquartered in Palo Alto, California.',
        'JPM': 'JPMorgan Chase & Co. is a financial holding company, which provides financial and investment banking services. It operates through four segments: Consumer & Community Banking, Corporate & Investment Bank, Commercial Banking, and Asset & Wealth Management. The company was founded in 1799 and is headquartered in New York, New York.',
        'NVDA': 'NVIDIA Corporation operates as a visual computing company worldwide. It operates in two segments: Graphics and Compute & Networking. The Graphics segment offers GPUs for gaming PCs and data centers. The company was founded in 1993 and is headquartered in Santa Clara, California.',
        'NFLX': 'Netflix, Inc. provides subscription streaming entertainment services. It offers TV series, documentaries, and feature films across various genres and languages. The company was founded in 1997 and is headquartered in Los Gatos, California.',
        'DIS': 'The Walt Disney Company, together with its subsidiaries, operates as an entertainment company worldwide. The company operates in two segments: Disney Media and Entertainment Distribution; and Disney Parks, Experiences and Products. It was founded in 1923 and is headquartered in Burbank, California.'
    };
    return summaries[stock] || 'This is a default summary for the selected stock.';
}

async function fetchStockStats(stock) {
    try {
        const response = await fetch(`https://stocks3.onrender.com/api/stocks/getstockstatsdata?stock=${stock}`);
        const data = await response.json();
        console.log(`Stock Stats for ${stock}:`, data);
        return data.stocksStatsData[0][stock];
    } catch (error) {
        console.error("Error fetching stock stats:", error);
        return {};
    }
}

// Add event listeners to range buttons
document.getElementById('range-buttons').addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
        const range = event.target.getAttribute('data-range');
        handleStockClick(currentStock, range);
    }
});
