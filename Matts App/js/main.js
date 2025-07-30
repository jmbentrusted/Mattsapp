import { db } from '../firebase-config.js';
import * as UI from './ui.js';
import * as Jobs from './jobs.js';
import * as Actions from './actions.js';
import * as Team from './team.js';
import * as Training from './training.js';
import * as Transition from './transition.js'; // Import the new module

// Make modules globally available for inline event handlers
window.UI = UI;
window.Jobs = Jobs;
window.Actions = Actions;
window.Team = Team;
window.Training = Training;
window.Transition = Transition; // Make transition functions available


function initializeApp() {
    UI.updateCurrentDate();
    setupEventListeners();
    loadInitialTab();
}

function setupEventListeners() {
    const navTabs = document.getElementById('navTabs');
    const navScrim = document.querySelector('.nav-scrim');

    navTabs.addEventListener('click', (e) => {
        const tabButton = e.target.closest('.nav-tab');
        if (tabButton) {
            showTab(tabButton.dataset.tab);
            navTabs.classList.remove('open'); // Close menu on selection
            if (navScrim) {
                navScrim.style.display = 'none';
            }
        }
    });

    const hamburger = document.getElementById('hamburgerMenu');
    hamburger.addEventListener('click', () => {
        navTabs.classList.toggle('open');
        if (navScrim) {
            navScrim.style.display = navTabs.classList.contains('open') ? 'block' : 'none';
        }
    });

    if (navScrim) {
        navScrim.addEventListener('click', () => {
            navTabs.classList.remove('open');
            navScrim.style.display = 'none';
        });
    }
}

function showTab(tabName) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    document.querySelector(`.nav-tab[data-tab="${tabName}"]`).classList.add('active');

    loadTabContent(tabName);
}

function loadTabContent(tabName) {
    const container = document.getElementById(tabName);
    container.innerHTML = '<h2>Loading...</h2>'; // Basic loader

    switch (tabName) {
        case 'transition': // Add case for the new tab
            Transition.loadTransitionPlan();
            break;
        case 'jobs':
            Jobs.loadJobs(db);
            break;
        case 'actions':
            Actions.loadActions(db);
            break;
        case 'team':
            Team.loadTeam(db);
            break;
        case 'training':
            Training.loadTraining(db);
            break;
    }
}

function loadInitialTab() {
    const activeTab = document.querySelector('.nav-tab.active').dataset.tab;
    showTab(activeTab);
}

document.addEventListener('DOMContentLoaded', initializeApp);