document.addEventListener('DOMContentLoaded', () => {
    // --- ÁREA DE CONFIGURAÇÃO ---
    // Adicionamos um parâmetro '?v=2' para ajudar a evitar problemas de cache
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxQN0Vnt7NriOVF2j7BayiyVxcbxTwY9IwUjUp8OuOJjRUTQCOkTS3CFdLQYXJ3U3FF/exec?v=2';
    const ADMIN_PASSWORD = "rifa123";
    const REPORT_PASSWORD = "report456";
    let rifaData = [];
    // --- FIM DA ÁREA DE CONFIGURAÇÃO ---

    const grid = document.getElementById('number-grid');
    const participantsList = document.getElementById('participants-list');
    const reservationForm = document.getElementById('reservation-form');
    const selectedNumberText = document.getElementById('selected-number-text');
    const adminLoginForm = document.getElementById('admin-login-form');
    const adminControls = document.getElementById('admin-controls');
    const adminParticipantsList = document.getElementById('admin-participants-list');
    const reportForm = document.getElementById('report-form');
    const reportOutput = document.getElementById('report-output');
    let numeroSelecionado = null;

    function renderizarPagina() {
        criarGrid();
        renderizarListaParticipantes();
        if (!adminControls.classList.contains('hidden')) {
            renderizarAdminList();
        }
    }

    function criarGrid() {
        grid.innerHTML = 'Carregando números...';
        if (rifaData.length === 0 && grid.dataset.loading === 'true') return;

        grid.innerHTML = '';
        for (let i = 1; i <= 100; i++) {
            const numeroEl = document.createElement('div');
            numeroEl.classList.add('numero');
            const numeroFormatado = String(i).padStart(2, '0');
            const comprador = rifaData.find(item => item.numero === i);
            if (comprador) {
                numeroEl.classList.add(comprador.status === 'pago' ? 'vendido-status' : 'pendente-status');
                const primeiroNome = comprador.nome.split(' ')[0];
                numeroEl.innerHTML = `<strong>${numeroFormatado}</strong><span class="comprador">${primeiroNome}</span>`;
            } else {
                numeroEl.classList.add('disponivel-status');
                numeroEl.innerHTML = `<strong>${numeroFormatado}</strong>`;
                numeroEl.addEventListener('click', () => selecionarNumero(i));
            }
            grid.appendChild(numeroEl);
        }
    }
    
    function selecionarNumero(numero) {
        numeroSelecionado = numero;
        selectedNumberText.innerHTML = `Número selecionado: <strong id="selected-number-display">${String(numero).padStart(2, '0')}</strong>`;
        document.getElementById('nome-comprador').focus();
    }

    function renderizarListaParticipantes() {
        participantsList.innerHTML = '';
        const dadosPagos = rifaData.filter(p => p.status === 'pago').sort((a, b) => a.numero - b.numero);
        if (dadosPagos.length === 0) {
            participantsList.innerHTML = '<p style="text-align:center; color:#777;">Seja o primeiro a participar!</p>';
            return;
        }
        dadosPagos.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('participant-item');
            const primeiroNome = item.nome.split(' ')[0];
            const ultimoInicial = item.nome.split(' ').length > 1 ? ` ${item.nome.split(' ').pop().charAt(0)}.` : '';
            itemDiv.innerHTML = `<span>${primeiroNome}${ultimoInicial}</span><strong>Nº ${String(item.numero).padStart(2, '0')}</strong>`;
            participantsList.appendChild(itemDiv);
        });
    }
    
    reservationForm.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!numeroSelecionado) { alert('Por favor, clique em um número disponível na rifa primeiro!'); return; }
        const nome = document.getElementById('nome-comprador').value;
        const telefone = document.getElementById('telefone-comprador').value;
        if (!/^\d{10,11}$/.test(telefone)) { alert('Digite um telefone válido com DDD (apenas números)'); return; }

        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Enviando...';

        const formData = new FormData();
        formData.append('numero', numeroSelecionado);
        formData.append('nome', nome);
        formData.append('telefone', telefone);

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData, mode: 'no-cors' }) // mode: 'no-cors' pode ajudar em alguns casos
            .then(() => { // Resposta no-cors é opaca, então não tentamos ler o JSON
                alert(`Reserva do número feita!\nSua participação está PENDENTE. Por favor, realize o pagamento via PIX e avise o organizador para confirmar.`);
                reservationForm.reset();
                selectedNumberText.innerHTML = `Clique em um número na rifa para começar.`;
                numeroSelecionado = null;
                setTimeout(() => carregarDadosDaPlanilha(), 500); // Dá um tempo para o Google processar
            })
            .catch(error => {
                console.error("Erro no fetch de reserva:", error);
                alert(`Ocorreu um erro ao salvar sua reserva. Por favor, tente novamente.`);
            })
            .finally(() => {
                submitButton.disabled = false;
                submitButton.textContent = 'Confirmar Reserva';
            });
    });

    adminLoginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (document.getElementById('admin-password').value === ADMIN_PASSWORD) {
            adminLoginForm.classList.add('hidden');
            adminControls.classList.remove('hidden');
            renderizarAdminList();
        } else { alert('Senha incorreta!'); }
    });

    function renderizarAdminList() {
        adminParticipantsList.innerHTML = '';
        const dadosOrdenados = [...rifaData].sort((a, b) => a.numero - b.numero);
        dadosOrdenados.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('admin-participant-item');
            const statusInfo = item.status === 'pendente' ? ' (Pendente)' : '';
            itemDiv.innerHTML = `<span class="info"><strong>${item.numero}</strong> - ${item.nome}${statusInfo}</span>`;
            
            const actionsDiv = document.createElement('div');
            actionsDiv.classList.add('actions');

            if (item.status === 'pendente') {
                const approveBtn = document.createElement('button');
                approveBtn.classList.add('approve-btn');
                approveBtn.innerHTML = '✔';
                approveBtn.addEventListener('click', () => aprovarParticipante(item.numero));
                actionsDiv.appendChild(approveBtn);
            }

            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.innerHTML = '&times;';
            deleteBtn.addEventListener('click', () => excluirParticipante(item.numero));
            actionsDiv.appendChild(deleteBtn);
            
            itemDiv.appendChild(actionsDiv);
            adminParticipantsList.appendChild(itemDiv);
        });
    }

    function aprovarParticipante(numero) {
        const formData = new FormData();
        formData.append('action', 'approve');
        formData.append('numero', numero);

        fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
            .then(res => { // Não vamos mais tentar ler o JSON, pois o retorno do Google pode ser um redirect
                if (res.ok || res.type === 'opaque') {
                    setTimeout(() => carregarDadosDaPlanilha(), 500); // Sucesso, recarrega tudo após um pequeno delay
                } else {
                    throw new Error(`A resposta do servidor não foi OK. Status: ${res.status}`);
                }
            }).catch(error => {
                console.error("Erro na operação de aprovar:", error);
                alert(`Erro ao aprovar. Verifique o console (F12) para detalhes. Pode ser necessário re-implantar o Google Script.`);
            });
    }

    function excluirParticipante(numero) {
        const participante = rifaData.find(p => p.numero === numero);
        if (confirm(`Tem certeza que deseja excluir a reserva do número ${numero} (${participante.nome})?`)) {
            const formData = new FormData();
            formData.append('action', 'delete');
            formData.append('numero', numero);

            fetch(GOOGLE_SCRIPT_URL, { method: 'POST', body: formData })
                .then(res => { // Mesmo tratamento da função de aprovar
                    if (res.ok || res.type === 'opaque') {
                         setTimeout(() => carregarDadosDaPlanilha(), 500); // Sucesso, recarrega tudo
                    } else {
                        throw new Error(`A resposta do servidor não foi OK. Status: ${res.status}`);
                    }
                }).catch(error => {
                    console.error("Erro na operação de excluir:", error);
                    alert(`Erro ao excluir. Verifique o console (F12) para detalhes. Pode ser necessário re-implantar o Google Script.`);
                });
        }
    }

    reportForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (document.getElementById('report-password').value === REPORT_PASSWORD) {
            let reportText = "Relatório de Participantes - Rifa Beneficente\n";
            reportText += "================================================\n";
            const dadosOrdenados = [...rifaData].sort((a, b) => a.numero - b.numero);
            dadosOrdenados.forEach(item => {
                const status = item.status.toUpperCase();
                reportText += `Nº: ${String(item.numero).padStart(3, '0')} | Nome: ${item.nome} | Telefone: ${item.telefone} | Status: ${status}\n`;
            });
            reportOutput.value = reportText;
            reportOutput.classList.remove('hidden');
            reportOutput.select();
        } else { alert('Senha do relatório incorreta!'); }
    });

    async function carregarDadosDaPlanilha() {
        grid.dataset.loading = 'true';
        try {
            // Para o GET, usamos uma URL com um timestamp para garantir que não pegamos dados do cache
            const response = await fetch(`${GOOGLE_SCRIPT_URL}&t=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);
            const data = await response.json();
            rifaData = data.data || [];
            renderizarPagina();
        } catch (error) {
            console.error('Falha ao carregar dados da rifa:', error);
            grid.innerHTML = '<p style="color:red; text-align:center;">Não foi possível carregar os números. Tente recarregar a página.</p>';
        } finally {
            grid.dataset.loading = 'false';
        }
    }

    carregarDadosDaPlanilha();
});
