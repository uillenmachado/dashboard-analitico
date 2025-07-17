/**
 * Dashboard Analítico - Módulo Principal
 * Responsável pela inicialização da aplicação e coordenação entre módulos
 */

class DashboardApp {
    constructor() {
        this.data = null;
        this.filteredData = null;
        this.isInitialized = false;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.handleFileUpload = this.handleFileUpload.bind(this);
        this.toggleTheme = this.toggleTheme.bind(this);
        this.showLoading = this.showLoading.bind(this);
        this.hideLoading = this.hideLoading.bind(this);
    }

    /**
     * Inicializa a aplicação
     */
    async init() {
        try {
            console.log('🚀 Inicializando Dashboard Analítico...');
            
            this.setupEventListeners();
            this.initializeTheme();
            this.initializeDatePickers();

            // ✅ Removido carregamento automático de exemplo.xlsx
            // await this.loadExampleData();

            this.isInitialized = true;
            console.log('✅ Dashboard inicializado com sucesso');
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.showError('Erro na inicialização da aplicação');
        }
    }

    setupEventListeners() {
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', this.handleFileUpload);
        }

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleTheme);
        }

        const applyFilters = document.getElementById('applyFilters');
        const clearFilters = document.getElementById('clearFilters');

        if (applyFilters) {
            applyFilters.addEventListener('click', () => {
                if (window.FiltersManager) {
                    window.FiltersManager.applyFilters();
                }
            });
        }

        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                if (window.FiltersManager) {
                    window.FiltersManager.clearFilters();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
                e.preventDefault();
                fileInput?.click();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('dashboard-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('dashboard-theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const lightIcon = document.querySelector('.theme-icon-light');
        const darkIcon = document.querySelector('.theme-icon-dark');
        if (theme === 'dark') {
            lightIcon?.classList.add('hidden');
            darkIcon?.classList.remove('hidden');
        } else {
            lightIcon?.classList.remove('hidden');
            darkIcon?.classList.add('hidden');
        }
    }

    initializeDatePickers() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');

        if (startDateInput && endDateInput) {
            const config = {
                locale: 'pt',
                dateFormat: 'd/m/Y',
                allowInput: true,
                clickOpens: true
            };

            flatpickr(startDateInput, {
                ...config,
                onChange: (selectedDates) => {
                    if (selectedDates.length > 0 && window.FiltersManager) {
                        window.FiltersManager.updateDateFilter('start', selectedDates[0]);
                    }
                }
            });

            flatpickr(endDateInput, {
                ...config,
                onChange: (selectedDates) => {
                    if (selectedDates.length > 0 && window.FiltersManager) {
                        window.FiltersManager.updateDateFilter('end', selectedDates[0]);
                    }
                }
            });
        }
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            this.showError('Por favor, selecione um arquivo Excel (.xlsx ou .xls)');
            return;
        }

        try {
            this.showLoading('Carregando arquivo...');
            const data = await window.DataService.loadExcelFile(file);
            await this.processData(data);
            this.hideLoading();
            this.showSuccess(`Arquivo carregado com sucesso! ${data.length} registros processados.`);
        } catch (error) {
            this.hideLoading();
            console.error('Erro no upload:', error);
            this.showError('Erro ao processar o arquivo. Verifique se é um arquivo Excel válido.');
        }
    }

    async processData(data) {
        this.data = data;
        this.filteredData = [...data];

        this.updateDataSummary();

        if (window.FiltersManager) {
            window.FiltersManager.initializeFilters(data);
        }

        if (window.KPICards) {
            window.KPICards.updateKPIs(this.filteredData);
        }

        if (window.ChartsManager) {
            window.ChartsManager.initializeCharts(this.filteredData);
        } else {
            console.warn('⚠️ ChartsManager não disponível');
        }

        this.showMainContent();
    }

    updateDataSummary() {
        const totalRecords = document.getElementById('totalRecords');
        const filteredRecords = document.getElementById('filteredRecords');
        const lastUpdate = document.getElementById('lastUpdate');

        if (totalRecords) totalRecords.textContent = this.data?.length || 0;
        if (filteredRecords) filteredRecords.textContent = this.filteredData?.length || 0;
        if (lastUpdate) lastUpdate.textContent = new Date().toLocaleString('pt-BR');
    }

    showMainContent() {
        const welcomeMessage = document.getElementById('welcomeMessage');
        const kpiGrid = document.getElementById('kpiGrid');
        const chartsSection = document.getElementById('chartsSection');

        if (welcomeMessage) welcomeMessage.classList.add('hidden');
        if (kpiGrid) kpiGrid.classList.remove('hidden');
        if (chartsSection) chartsSection.classList.remove('hidden');
    }

    showLoading(message = 'Carregando...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.querySelector('p').textContent = message;
            overlay.classList.remove('hidden');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} fixed top-4 right-4 z-50 max-w-sm shadow-lg`;
        toast.innerHTML = `
            <div class="flex items-center">
                <i data-lucide="${type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle' : 'info'}" class="w-5 h-5 mr-2"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(toast);
        lucide.createIcons();

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    updateFilteredData(filteredData) {
        this.filteredData = filteredData;
        this.updateDataSummary();

        if (window.KPICards) {
            window.KPICards.updateKPIs(this.filteredData);
        }

        if (window.ChartsManager) {
            window.ChartsManager.updateCharts(this.filteredData);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.DashboardApp = new DashboardApp();
    window.DashboardApp.init();
});

window.DashboardApp = DashboardApp;
