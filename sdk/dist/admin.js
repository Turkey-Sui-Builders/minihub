#!/usr/bin/env node
/**
 * MiniHub Admin CLI Tool
 *
 * Comprehensive admin tool for managing the MiniHub decentralized job board
 *
 * Features:
 * - System statistics and monitoring
 * - Job management (list, view, deactivate)
 * - User and employer profile management
 * - Application tracking
 * - Event monitoring
 * - Data export and reporting
 *
 * @module minihub-admin
 */
import { Command } from 'commander';
import { SuiClient } from '@mysten/sui/client';
import { createMiniHubSDK, DEFAULT_CLOCK_ID } from './minihub.js';
import * as fs from 'fs';
import * as path from 'path';
// ====== Configuration ======
// ====== Yapılandırma ======
// Helper function to get fullnode URL
function getFullnodeUrl(network) {
    const urls = {
        mainnet: 'https://fullnode.mainnet.sui.io:443',
        testnet: 'https://fullnode.testnet.sui.io:443',
        devnet: 'https://fullnode.devnet.sui.io:443',
        localnet: 'http://127.0.0.1:9000',
    };
    return urls[network] || urls.testnet;
}
const CONFIG_FILE = path.join(process.cwd(), 'minihub.config.json');
/**
 * Yapılandırmayı dosyadan yükler
 */
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
            return JSON.parse(data);
        }
    }
    catch (error) {
        console.error('❌ Yapılandırma dosyası yüklenemedi:', error);
    }
    return null;
}
/**
 * Yapılandırmayı dosyaya kaydeder
 */
function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        console.log('✅ Yapılandırma kaydedildi:', CONFIG_FILE);
    }
    catch (error) {
        console.error('❌ Yapılandırma kaydedilemedi:', error);
    }
}
/**
 * SDK'yı başlatır
 */
function initializeSDK(config) {
    const client = new SuiClient({ url: getFullnodeUrl(config.network) });
    const packageConfig = {
        packageId: config.packageId,
        jobBoardId: config.jobBoardId,
        userRegistryId: config.userRegistryId,
        employerRegistryId: config.employerRegistryId,
        clockId: config.clockId || DEFAULT_CLOCK_ID,
    };
    return createMiniHubSDK(client, packageConfig);
}
// ====== CLI Program ======
// ====== CLI Programı ======
const program = new Command();
program
    .name('minihub-admin')
    .description('🚀 MiniHub Admin CLI - Decentralized Job Board Management Tool')
    .version('1.0.0');
// ====== Config Commands ======
// ====== Yapılandırma Komutları ======
const configCmd = program
    .command('config')
    .description('⚙️  Yapılandırma yönetimi');
configCmd
    .command('init')
    .description('Yeni yapılandırma oluştur')
    .requiredOption('-n, --network <network>', 'Ağ (mainnet/testnet/devnet/localnet)')
    .requiredOption('-p, --package <id>', 'Paket ID')
    .requiredOption('-j, --job-board <id>', 'JobBoard objesi ID')
    .requiredOption('-u, --user-registry <id>', 'UserRegistry objesi ID')
    .requiredOption('-e, --employer-registry <id>', 'EmployerRegistry objesi ID')
    .option('-c, --clock <id>', 'Clock objesi ID (varsayılan: 0x6)')
    .action((options) => {
    const config = {
        network: options.network,
        packageId: options.package,
        jobBoardId: options.jobBoard,
        userRegistryId: options.userRegistry,
        employerRegistryId: options.employerRegistry,
        clockId: options.clock,
    };
    saveConfig(config);
    console.log('✅ Yapılandırma başarıyla oluşturuldu!');
});
configCmd
    .command('show')
    .description('Mevcut yapılandırmayı göster')
    .action(() => {
    const config = loadConfig();
    if (config) {
        console.log('\n📋 Mevcut Yapılandırma:\n');
        console.log(JSON.stringify(config, null, 2));
    }
    else {
        console.log('❌ Yapılandırma bulunamadı. "config init" komutunu kullanın.');
    }
});
configCmd
    .command('update')
    .description('Yapılandırmayı güncelle')
    .option('-n, --network <network>', 'Ağ')
    .option('-p, --package <id>', 'Paket ID')
    .option('-j, --job-board <id>', 'JobBoard ID')
    .option('-u, --user-registry <id>', 'UserRegistry ID')
    .option('-e, --employer-registry <id>', 'EmployerRegistry ID')
    .option('-c, --clock <id>', 'Clock ID')
    .action((options) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı. "config init" komutunu kullanın.');
        return;
    }
    if (options.network)
        config.network = options.network;
    if (options.package)
        config.packageId = options.package;
    if (options.jobBoard)
        config.jobBoardId = options.jobBoard;
    if (options.userRegistry)
        config.userRegistryId = options.userRegistry;
    if (options.employerRegistry)
        config.employerRegistryId = options.employerRegistry;
    if (options.clock)
        config.clockId = options.clock;
    saveConfig(config);
    console.log('✅ Yapılandırma güncellendi!');
});
// ====== Stats Commands ======
// ====== İstatistik Komutları ======
program
    .command('stats')
    .description('📊 Sistem istatistiklerini göster')
    .option('-d, --detailed', 'Detaylı istatistikler')
    .action(async (options) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı. "config init" komutunu kullanın.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        console.log('\n📊 Sistem İstatistikleri\n');
        console.log('Veriler yükleniyor...\n');
        const stats = await sdk.getStatistics();
        console.log('═══════════════════════════════════════');
        console.log(`🏢 Toplam İşveren:        ${stats.totalEmployers}`);
        console.log(`👤 Toplam Kullanıcı:      ${stats.totalUsers}`);
        console.log(`📝 Toplam İş İlanı:       ${stats.totalJobs}`);
        console.log(`✅ Aktif İlanlar:         ${stats.activeJobs}`);
        console.log(`💼 Dolu Pozisyonlar:      ${stats.filledJobs}`);
        console.log(`📄 Toplam Başvuru:        ${stats.totalApplications}`);
        console.log('═══════════════════════════════════════');
        if (stats.totalJobs > 0) {
            const fillRate = ((stats.filledJobs / stats.totalJobs) * 100).toFixed(1);
            const activeRate = ((stats.activeJobs / stats.totalJobs) * 100).toFixed(1);
            console.log(`\n📈 Doluluk Oranı:         ${fillRate}%`);
            console.log(`📈 Aktiflik Oranı:        ${activeRate}%`);
            if (stats.totalJobs > 0) {
                const avgApplications = (stats.totalApplications / stats.totalJobs).toFixed(1);
                console.log(`📊 Ortalama Başvuru:      ${avgApplications} / ilan`);
            }
        }
        if (options.detailed) {
            console.log('\n🔍 Detaylı Bilgiler:\n');
            console.log(`Ağ:                      ${config.network}`);
            console.log(`Paket ID:                ${config.packageId}`);
            console.log(`JobBoard ID:             ${config.jobBoardId}`);
            console.log(`UserRegistry ID:         ${config.userRegistryId}`);
            console.log(`EmployerRegistry ID:     ${config.employerRegistryId}`);
        }
        console.log('');
    }
    catch (error) {
        console.error('❌ İstatistikler alınamadı:', error);
    }
});
// ====== Jobs Commands ======
// ====== İş İlanı Komutları ======
const jobsCmd = program
    .command('jobs')
    .description('💼 İş ilanı yönetimi');
jobsCmd
    .command('list')
    .description('Tüm iş ilanlarını listele')
    .option('-a, --active', 'Sadece aktif ilanlar')
    .option('-f, --filled', 'Sadece dolu pozisyonlar')
    .option('-l, --limit <number>', 'Gösterilecek maksimum ilan sayısı', '10')
    .action(async (options) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        console.log('\n💼 İş İlanları Listesi\n');
        let jobs = await sdk.getAllJobs();
        if (options.active) {
            jobs = jobs.filter(job => sdk.isJobActive(job));
        }
        if (options.filled) {
            jobs = jobs.filter(job => job.hiredCandidate);
        }
        const limit = parseInt(options.limit);
        jobs = jobs.slice(0, limit);
        if (jobs.length === 0) {
            console.log('📭 İlan bulunamadı.\n');
            return;
        }
        jobs.forEach((job, index) => {
            const status = job.hiredCandidate ? '💼 DOLU' :
                sdk.isJobActive(job) ? '✅ AKTİF' : '❌ KAPALI';
            console.log(`${index + 1}. ${job.title}`);
            console.log(`   ID: ${job.id}`);
            console.log(`   Durum: ${status}`);
            console.log(`   İşveren: ${job.employer}`);
            console.log(`   Başvuru: ${job.applicationCount}`);
            if (job.salary) {
                console.log(`   Maaş: ${job.salary} SUI`);
            }
            console.log(`   Son Tarih: ${new Date(job.deadline).toLocaleString('tr-TR')}`);
            console.log('');
        });
        console.log(`📊 Toplam ${jobs.length} ilan gösteriliyor.\n`);
    }
    catch (error) {
        console.error('❌ İlanlar listelenemedi:', error);
    }
});
jobsCmd
    .command('view <jobId>')
    .description('İş ilanı detaylarını göster')
    .option('-s, --show-applications', 'Başvuruları da göster')
    .action(async (jobId, options) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        console.log('\n🔍 İş İlanı Detayları\n');
        const job = await sdk.getJob(jobId);
        if (!job) {
            console.log('❌ İlan bulunamadı.\n');
            return;
        }
        console.log('═══════════════════════════════════════');
        console.log(`📌 Başlık:          ${job.title}`);
        console.log(`🆔 ID:              ${job.id}`);
        console.log(`👔 İşveren:         ${job.employer}`);
        console.log(`🏢 İşveren Profil:  ${job.employerProfileId}`);
        console.log(`📝 Açıklama:        ${job.description}`);
        if (job.salary) {
            console.log(`💰 Maaş:            ${job.salary} SUI`);
        }
        console.log(`📊 Başvuru Sayısı:  ${job.applicationCount}`);
        console.log(`📅 Son Tarih:       ${new Date(job.deadline).toLocaleString('tr-TR')}`);
        console.log(`✅ Aktif:           ${sdk.isJobActive(job) ? 'Evet' : 'Hayır'}`);
        if (job.hiredCandidate) {
            console.log(`💼 İşe Alınan:      ${job.hiredCandidate}`);
        }
        console.log('═══════════════════════════════════════');
        if (options.showApplications && job.applicationCount > 0) {
            console.log('\n📄 Başvurular:\n');
            const applications = await sdk.getJobApplications(jobId);
            applications.forEach((app, index) => {
                console.log(`${index + 1}. Aday: ${app.candidate}`);
                console.log(`   Profil ID: ${app.userProfileId}`);
                console.log(`   Mesaj: ${app.coverMessage}`);
                console.log(`   CV: ${app.cvUrl}`);
                console.log(`   Tarih: ${new Date(app.timestamp).toLocaleString('tr-TR')}`);
                console.log('');
            });
        }
        console.log('');
    }
    catch (error) {
        console.error('❌ İlan detayları alınamadı:', error);
    }
});
jobsCmd
    .command('search <query>')
    .description('İş ilanlarında arama yap')
    .action(async (query) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        console.log(`\n🔍 "${query}" araması yapılıyor...\n`);
        const allJobs = await sdk.getAllJobs();
        const results = sdk.searchJobs(allJobs, query);
        if (results.length === 0) {
            console.log('📭 Sonuç bulunamadı.\n');
            return;
        }
        results.forEach((job, index) => {
            console.log(`${index + 1}. ${job.title}`);
            console.log(`   ID: ${job.id}`);
            console.log(`   İşveren: ${job.employer}`);
            console.log(`   Başvuru: ${job.applicationCount}`);
            console.log('');
        });
        console.log(`📊 ${results.length} sonuç bulundu.\n`);
    }
    catch (error) {
        console.error('❌ Arama yapılamadı:', error);
    }
});
// ====== Users Commands ======
// ====== Kullanıcı Komutları ======
const usersCmd = program
    .command('users')
    .description('👥 Kullanıcı yönetimi');
usersCmd
    .command('list')
    .description('Tüm kullanıcıları listele')
    .option('-l, --limit <number>', 'Gösterilecek maksimum kullanıcı sayısı', '20')
    .action(async (options) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        console.log('\n👥 Kullanıcı Listesi\n');
        const profiles = await sdk.getAllUserProfiles();
        const limit = parseInt(options.limit);
        const limitedProfiles = profiles.slice(0, limit);
        if (limitedProfiles.length === 0) {
            console.log('📭 Kullanıcı bulunamadı.\n');
            return;
        }
        limitedProfiles.forEach((profile, index) => {
            console.log(`${index + 1}. ${profile.name}`);
            console.log(`   ID: ${profile.id}`);
            console.log(`   Adres: ${profile.userAddress}`);
            console.log(`   Tecrübe: ${profile.experienceYears} yıl`);
            console.log(`   Yetenekler: ${profile.skills.join(', ')}`);
            console.log('');
        });
        console.log(`📊 Toplam ${limitedProfiles.length} kullanıcı gösteriliyor.\n`);
    }
    catch (error) {
        console.error('❌ Kullanıcılar listelenemedi:', error);
    }
});
usersCmd
    .command('view <profileId>')
    .description('Kullanıcı profili detaylarını göster')
    .action(async (profileId) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        console.log('\n👤 Kullanıcı Profili\n');
        const profile = await sdk.getUserProfile(profileId);
        if (!profile) {
            console.log('❌ Profil bulunamadı.\n');
            return;
        }
        console.log('═══════════════════════════════════════');
        console.log(`👤 Ad:              ${profile.name}`);
        console.log(`🆔 ID:              ${profile.id}`);
        console.log(`📧 Adres:           ${profile.userAddress}`);
        console.log(`📝 Bio:             ${profile.bio}`);
        console.log(`🖼️  Avatar:          ${profile.avatarUrl}`);
        console.log(`💼 Tecrübe:         ${profile.experienceYears} yıl`);
        console.log(`🎯 Yetenekler:      ${profile.skills.join(', ')}`);
        console.log(`🌐 Portfolio:       ${profile.portfolioUrl}`);
        console.log(`📅 Oluşturulma:     ${new Date(profile.createdAt).toLocaleString('tr-TR')}`);
        console.log(`📅 Güncelleme:      ${new Date(profile.updatedAt).toLocaleString('tr-TR')}`);
        console.log('═══════════════════════════════════════\n');
    }
    catch (error) {
        console.error('❌ Profil alınamadı:', error);
    }
});
usersCmd
    .command('search <skills...>')
    .description('Yeteneklere göre kullanıcı ara')
    .action(async (skills) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        console.log(`\n🔍 "${skills.join(', ')}" yeteneklerine sahip kullanıcılar aranıyor...\n`);
        const allProfiles = await sdk.getAllUserProfiles();
        const results = sdk.searchUserProfilesBySkills(allProfiles, skills);
        if (results.length === 0) {
            console.log('📭 Sonuç bulunamadı.\n');
            return;
        }
        results.forEach((profile, index) => {
            console.log(`${index + 1}. ${profile.name}`);
            console.log(`   ID: ${profile.id}`);
            console.log(`   Yetenekler: ${profile.skills.join(', ')}`);
            console.log(`   Tecrübe: ${profile.experienceYears} yıl`);
            console.log('');
        });
        console.log(`📊 ${results.length} kullanıcı bulundu.\n`);
    }
    catch (error) {
        console.error('❌ Arama yapılamadı:', error);
    }
});
// ====== Employers Commands ======
// ====== İşveren Komutları ======
const employersCmd = program
    .command('employers')
    .description('🏢 İşveren yönetimi');
employersCmd
    .command('list')
    .description('Tüm işverenleri listele')
    .option('-l, --limit <number>', 'Gösterilecek maksimum işveren sayısı', '20')
    .action(async (options) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        console.log('\n🏢 İşveren Listesi\n');
        const profiles = await sdk.getAllEmployerProfiles();
        const limit = parseInt(options.limit);
        const limitedProfiles = profiles.slice(0, limit);
        if (limitedProfiles.length === 0) {
            console.log('📭 İşveren bulunamadı.\n');
            return;
        }
        limitedProfiles.forEach((profile, index) => {
            console.log(`${index + 1}. ${profile.companyName}`);
            console.log(`   ID: ${profile.id}`);
            console.log(`   Adres: ${profile.employerAddress}`);
            console.log(`   Sektör: ${profile.industry}`);
            console.log(`   Çalışan: ${profile.employeeCount} kişi`);
            console.log('');
        });
        console.log(`📊 Toplam ${limitedProfiles.length} işveren gösteriliyor.\n`);
    }
    catch (error) {
        console.error('❌ İşverenler listelenemedi:', error);
    }
});
employersCmd
    .command('view <profileId>')
    .description('İşveren profili detaylarını göster')
    .action(async (profileId) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        console.log('\n🏢 İşveren Profili\n');
        const profile = await sdk.getEmployerProfile(profileId);
        if (!profile) {
            console.log('❌ Profil bulunamadı.\n');
            return;
        }
        console.log('═══════════════════════════════════════');
        console.log(`🏢 Şirket:          ${profile.companyName}`);
        console.log(`🆔 ID:              ${profile.id}`);
        console.log(`📧 Adres:           ${profile.employerAddress}`);
        console.log(`📝 Açıklama:        ${profile.description}`);
        console.log(`🖼️  Logo:            ${profile.logoUrl}`);
        console.log(`🌐 Website:         ${profile.website}`);
        console.log(`🏭 Sektör:          ${profile.industry}`);
        console.log(`👥 Çalışan:         ${profile.employeeCount} kişi`);
        console.log(`📅 Kuruluş:         ${profile.foundedYear}`);
        console.log(`📅 Oluşturulma:     ${new Date(profile.createdAt).toLocaleString('tr-TR')}`);
        console.log(`📅 Güncelleme:      ${new Date(profile.updatedAt).toLocaleString('tr-TR')}`);
        console.log('═══════════════════════════════════════\n');
    }
    catch (error) {
        console.error('❌ Profil alınamadı:', error);
    }
});
employersCmd
    .command('search <industry>')
    .description('Sektöre göre işveren ara')
    .action(async (industry) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        console.log(`\n🔍 "${industry}" sektöründeki işverenler aranıyor...\n`);
        const allProfiles = await sdk.getAllEmployerProfiles();
        const results = sdk.filterEmployersByIndustry(allProfiles, industry);
        if (results.length === 0) {
            console.log('📭 Sonuç bulunamadı.\n');
            return;
        }
        results.forEach((profile, index) => {
            console.log(`${index + 1}. ${profile.companyName}`);
            console.log(`   ID: ${profile.id}`);
            console.log(`   Sektör: ${profile.industry}`);
            console.log(`   Çalışan: ${profile.employeeCount} kişi`);
            console.log('');
        });
        console.log(`📊 ${results.length} işveren bulundu.\n`);
    }
    catch (error) {
        console.error('❌ Arama yapılamadı:', error);
    }
});
// ====== Events Commands ======
// ====== Olay Komutları ======
const eventsCmd = program
    .command('events')
    .description('📡 Olay izleme');
eventsCmd
    .command('jobs')
    .description('İş ilanı olaylarını göster')
    .option('-l, --limit <number>', 'Gösterilecek maksimum olay sayısı', '10')
    .action(async (options) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        const limit = parseInt(options.limit);
        console.log('\n📡 İş İlanı Olayları\n');
        const events = await sdk.getJobPostedEvents(limit);
        if (events.length === 0) {
            console.log('📭 Olay bulunamadı.\n');
            return;
        }
        events.forEach((event, index) => {
            console.log(`${index + 1}. İlan Yayınlandı`);
            console.log(`   İlan ID: ${event.jobId}`);
            console.log(`   İşveren: ${event.employer}`);
            console.log(`   Başlık: ${event.title}`);
            console.log(`   Maaş: ${event.hasSalary ? 'Belirtildi' : 'Belirtilmedi'}`);
            console.log(`   Son Tarih: ${new Date(event.deadline).toLocaleString('tr-TR')}`);
            console.log('');
        });
    }
    catch (error) {
        console.error('❌ Olaylar alınamadı:', error);
    }
});
eventsCmd
    .command('applications')
    .description('Başvuru olaylarını göster')
    .option('-l, --limit <number>', 'Gösterilecek maksimum olay sayısı', '10')
    .action(async (options) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        const limit = parseInt(options.limit);
        console.log('\n📡 Başvuru Olayları\n');
        const events = await sdk.getApplicationSubmittedEvents(limit);
        if (events.length === 0) {
            console.log('📭 Olay bulunamadı.\n');
            return;
        }
        events.forEach((event, index) => {
            console.log(`${index + 1}. Başvuru Yapıldı`);
            console.log(`   İlan ID: ${event.jobId}`);
            console.log(`   Aday: ${event.candidate}`);
            console.log(`   Başvuru ID: ${event.applicationId}`);
            console.log(`   Tarih: ${new Date(event.timestamp).toLocaleString('tr-TR')}`);
            console.log('');
        });
    }
    catch (error) {
        console.error('❌ Olaylar alınamadı:', error);
    }
});
eventsCmd
    .command('hires')
    .description('İşe alma olaylarını göster')
    .option('-l, --limit <number>', 'Gösterilecek maksimum olay sayısı', '10')
    .action(async (options) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        const limit = parseInt(options.limit);
        console.log('\n📡 İşe Alma Olayları\n');
        const events = await sdk.getCandidateHiredEvents(limit);
        if (events.length === 0) {
            console.log('📭 Olay bulunamadı.\n');
            return;
        }
        events.forEach((event, index) => {
            console.log(`${index + 1}. Aday İşe Alındı`);
            console.log(`   İlan ID: ${event.jobId}`);
            console.log(`   İşveren: ${event.employer}`);
            console.log(`   Aday: ${event.candidate}`);
            console.log('');
        });
    }
    catch (error) {
        console.error('❌ Olaylar alınamadı:', error);
    }
});
// ====== Export Commands ======
// ====== Dışa Aktarma Komutları ======
const exportCmd = program
    .command('export')
    .description('📥 Veri dışa aktarma');
exportCmd
    .command('jobs')
    .description('Tüm iş ilanlarını JSON olarak dışa aktar')
    .option('-o, --output <file>', 'Çıktı dosyası', 'jobs.json')
    .action(async (options) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        console.log('\n📥 İş ilanları dışa aktarılıyor...\n');
        const jobs = await sdk.getAllJobs();
        fs.writeFileSync(options.output, JSON.stringify(jobs, null, 2));
        console.log(`✅ ${jobs.length} ilan başarıyla dışa aktarıldı: ${options.output}\n`);
    }
    catch (error) {
        console.error('❌ Dışa aktarma başarısız:', error);
    }
});
exportCmd
    .command('users')
    .description('Tüm kullanıcıları JSON olarak dışa aktar')
    .option('-o, --output <file>', 'Çıktı dosyası', 'users.json')
    .action(async (options) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        console.log('\n📥 Kullanıcılar dışa aktarılıyor...\n');
        const users = await sdk.getAllUserProfiles();
        fs.writeFileSync(options.output, JSON.stringify(users, null, 2));
        console.log(`✅ ${users.length} kullanıcı başarıyla dışa aktarıldı: ${options.output}\n`);
    }
    catch (error) {
        console.error('❌ Dışa aktarma başarısız:', error);
    }
});
exportCmd
    .command('employers')
    .description('Tüm işverenleri JSON olarak dışa aktar')
    .option('-o, --output <file>', 'Çıktı dosyası', 'employers.json')
    .action(async (options) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        console.log('\n📥 İşverenler dışa aktarılıyor...\n');
        const employers = await sdk.getAllEmployerProfiles();
        fs.writeFileSync(options.output, JSON.stringify(employers, null, 2));
        console.log(`✅ ${employers.length} işveren başarıyla dışa aktarıldı: ${options.output}\n`);
    }
    catch (error) {
        console.error('❌ Dışa aktarma başarısız:', error);
    }
});
exportCmd
    .command('all')
    .description('Tüm verileri dışa aktar')
    .option('-d, --dir <directory>', 'Çıktı dizini', 'exports')
    .action(async (options) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    try {
        const sdk = initializeSDK(config);
        console.log('\n📥 Tüm veriler dışa aktarılıyor...\n');
        // Dizini oluştur
        if (!fs.existsSync(options.dir)) {
            fs.mkdirSync(options.dir, { recursive: true });
        }
        const [jobs, users, employers, stats] = await Promise.all([
            sdk.getAllJobs(),
            sdk.getAllUserProfiles(),
            sdk.getAllEmployerProfiles(),
            sdk.getStatistics(),
        ]);
        // Dosyaları yaz
        fs.writeFileSync(path.join(options.dir, 'jobs.json'), JSON.stringify(jobs, null, 2));
        fs.writeFileSync(path.join(options.dir, 'users.json'), JSON.stringify(users, null, 2));
        fs.writeFileSync(path.join(options.dir, 'employers.json'), JSON.stringify(employers, null, 2));
        fs.writeFileSync(path.join(options.dir, 'stats.json'), JSON.stringify(stats, null, 2));
        // Özet rapor
        const report = {
            exportDate: new Date().toISOString(),
            network: config.network,
            packageId: config.packageId,
            statistics: stats,
            files: {
                jobs: `${options.dir}/jobs.json`,
                users: `${options.dir}/users.json`,
                employers: `${options.dir}/employers.json`,
                stats: `${options.dir}/stats.json`,
            },
        };
        fs.writeFileSync(path.join(options.dir, 'report.json'), JSON.stringify(report, null, 2));
        console.log('✅ Tüm veriler başarıyla dışa aktarıldı!\n');
        console.log(`📁 Dizin: ${options.dir}`);
        console.log(`📊 ${jobs.length} ilan`);
        console.log(`👥 ${users.length} kullanıcı`);
        console.log(`🏢 ${employers.length} işveren\n`);
    }
    catch (error) {
        console.error('❌ Dışa aktarma başarısız:', error);
    }
});
// ====== Monitor Command ======
// ====== İzleme Komutu ======
program
    .command('monitor')
    .description('🔄 Sistem durumunu sürekli izle')
    .option('-i, --interval <seconds>', 'Güncelleme aralığı (saniye)', '30')
    .action(async (options) => {
    const config = loadConfig();
    if (!config) {
        console.log('❌ Yapılandırma bulunamadı.');
        return;
    }
    const interval = parseInt(options.interval) * 1000;
    const sdk = initializeSDK(config);
    console.log('\n🔄 Sistem izleme başlatıldı...');
    console.log(`📊 Her ${options.interval} saniyede bir güncelleme\n`);
    console.log('Ctrl+C ile durdurun\n');
    const monitor = async () => {
        try {
            const stats = await sdk.getStatistics();
            const timestamp = new Date().toLocaleString('tr-TR');
            console.clear();
            console.log('═════════════════════════════════════════════════');
            console.log(`🔄 MiniHub Sistem İzleme - ${timestamp}`);
            console.log('═════════════════════════════════════════════════');
            console.log(`🏢 İşverenler:        ${stats.totalEmployers}`);
            console.log(`👤 Kullanıcılar:      ${stats.totalUsers}`);
            console.log(`📝 Toplam İlanlar:    ${stats.totalJobs}`);
            console.log(`✅ Aktif İlanlar:     ${stats.activeJobs}`);
            console.log(`💼 Dolu Pozisyonlar:  ${stats.filledJobs}`);
            console.log(`📄 Toplam Başvurular: ${stats.totalApplications}`);
            console.log('═════════════════════════════════════════════════');
            console.log(`\n⏰ Sonraki güncelleme: ${options.interval} saniye\n`);
        }
        catch (error) {
            console.error('❌ İzleme hatası:', error);
        }
    };
    // İlk çalıştırma
    await monitor();
    // Periyodik güncelleme
    setInterval(monitor, interval);
});
// ====== Help Command ======
// ====== Yardım Komutu ======
program
    .command('help-guide')
    .description('📖 Detaylı kullanım kılavuzu')
    .action(() => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║           MiniHub Admin CLI - Kullanım Kılavuzu              ║
╚═══════════════════════════════════════════════════════════════╝

🚀 Başlangıç

1. Yapılandırma oluşturun:
   $ minihub-admin config init \\
       --network testnet \\
       --package 0x... \\
       --job-board 0x... \\
       --user-registry 0x... \\
       --employer-registry 0x...

2. Yapılandırmayı kontrol edin:
   $ minihub-admin config show

3. Sistem istatistiklerini görün:
   $ minihub-admin stats

📊 İstatistikler ve İzleme

- Sistem durumu: minihub-admin stats
- Detaylı istatistikler: minihub-admin stats --detailed
- Canlı izleme: minihub-admin monitor

💼 İş İlanları

- Tüm ilanları listele: minihub-admin jobs list
- Aktif ilanlar: minihub-admin jobs list --active
- İlan detayları: minihub-admin jobs view <job-id>
- İlan arama: minihub-admin jobs search <query>

👥 Kullanıcılar

- Kullanıcı listele: minihub-admin users list
- Profil görüntüle: minihub-admin users view <profile-id>
- Yetenek ara: minihub-admin users search <skill1> <skill2>

🏢 İşverenler

- İşveren listele: minihub-admin employers list
- Profil görüntüle: minihub-admin employers view <profile-id>
- Sektör ara: minihub-admin employers search <industry>

📡 Olaylar

- İlan olayları: minihub-admin events jobs
- Başvuru olayları: minihub-admin events applications
- İşe alma olayları: minihub-admin events hires

📥 Veri Dışa Aktarma

- İlanları dışa aktar: minihub-admin export jobs
- Kullanıcıları dışa aktar: minihub-admin export users
- İşverenleri dışa aktar: minihub-admin export employers
- Tüm verileri dışa aktar: minihub-admin export all

💡 İpuçları

- Her komutta --help ile yardım alabilirsiniz
- JSON çıktıları diğer araçlarla kolayca işlenebilir
- Monitor komutu ile gerçek zamanlı izleme yapabilirsiniz

📚 Daha Fazla Bilgi

- GitHub: https://github.com/yourusername/minihub
- Docs: https://minihub.example.com/docs

`);
});
// ====== Parse and Execute ======
// ====== Ayrıştır ve Çalıştır ======
program.parse(process.argv);
