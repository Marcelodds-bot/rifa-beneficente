document.addEventListener('DOMContentLoaded', () => {
    // --- ÁREA DE CONFIGURAÇÃO ---
    // ATENÇÃO: Para produção real, remova senhas do código!
    const ADMIN_PASSWORD = "rifa123";
    const REPORT_PASSWORD = "report456";
    const rifaData = [
        { numero: 14, nome: "Maria Silva", telefone: "11988887777", status: 'pago' },
        { numero: 15, nome: "João Pereira", telefone: "21977776666", status: 'pago' },
        { numero: 23, nome: "Ana Lima", telefone: "31966665555", status: 'pendente' },
        { numero: 26, nome: "Carlos Souza", telefone: "81955554444", status: 'pago' },
    ];
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
        grid.innerHTML = '';
        for (let i = 1; i <= 100; i++) {
            const numeroEl = document.createElement('div');
            numeroEl.classList.add('numero');
            const numeroFormatado = String(i).padStart(2, '0');
            const comprador = rifaData.find(item => item.numero === i);
            if (comprador) {
                if(comprador.status === 'pago') {
                    numeroEl.classList.add('vendido-status');
                } else {
                    numeroEl.classList.add('pendente-status');
                }
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
        if (!/^\d{10,11}$/.test(telefone)) {
            alert('Digite um telefone válido com DDD (apenas números)');
            return;
        }
        rifaData.push({ numero: numeroSelecionado, nome: nome, telefone: telefone, status: 'pendente' });
        renderizarPagina();
        reservationForm.reset();
        selectedNumberText.innerHTML = `Clique em um número na rifa para começar.`;
        numeroSelecionado = null;
        alert(`Reserva do número feita!\nSua participação está PENDENTE. Por favor, realize o pagamento via PIX e avise o organizador para confirmar.`);
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

    function aprovarParticipante(numeroParaAprovar) {
        const participante = rifaData.find(p => p.numero === numeroParaAprovar);
        if (participante) {
            participante.status = 'pago';
            renderizarPagina();
        }
    }

    function excluirParticipante(numeroParaExcluir) {
        const participante = rifaData.find(p => p.numero === numeroParaExcluir);
        if (confirm(`Tem certeza que deseja excluir a reserva do número ${numeroParaExcluir} (${participante.nome})?`)) {
            const index = rifaData.findIndex(p => p.numero === numeroParaExcluir);
            if (index > -1) {
                rifaData.splice(index, 1);
                renderizarPagina();
            }
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

    renderizarPagina();
});