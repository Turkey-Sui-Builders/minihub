/// Module: minihub - Decentralized Job Board
module minihub::minihub {
    use sui::event;
    use std::string::{String};
    use sui::package;
    use sui::dynamic_object_field;
    use minihub::version::Version;

    // ====== One-Time Witness for Upgrade Capability ======
    // ====== Contract Yükseltme Yetkisi için One-Time Witness ======
    
    /// One-time witness struct - must be named exactly as module in UPPERCASE
    /// Tek kullanımlık tanık yapısı - modül adıyla BÜYÜK HARFLE aynı olmalı
    public struct MINIHUB has drop {}

    // ====== Error Codes ======
    // ====== Hata Kodları ======
    const ENotAuthorized: u64 = 1;        // Yetkisiz erişim
    const EJobAlreadyFilled: u64 = 2;     // İş pozisyonu zaten dolu
    const EInvalidApplication: u64 = 3;   // Geçersiz başvuru
    const EDeadlinePassed: u64 = 4;       // Son başvuru tarihi geçti

    // ====== Structs ======
    // ====== Veri Yapıları ======
    
    /// Shared object that tracks all jobs on the platform
    /// Platformdaki tüm iş ilanlarını takip eden paylaşımlı obje
    public struct JobBoard has key {
        id: UID,
        job_count: u64,              // Toplam iş ilanı sayısı
        job_ids: vector<ID>,         // Yayınlanan tüm iş ilanlarının ID'leri
    }

    /// Represents a job posting
    /// Bir iş ilanını temsil eder
    public struct Job has key, store {
        id: UID,
        employer: address,                      // İşveren adresi
        employer_profile_id: ID,                // İşveren profili ID'si (YENİ)
        title: String,                          // İş başlığı
        description: String,                    // İş açıklaması
        salary: Option<u64>,                    // Opsiyonel maaş (Option<T> kullanarak)
        application_count: u64,                 // Başvuru sayısı
        hired_candidate: Option<address>,       // İşe alınan aday (Option<T>)
        is_active: bool,                        // İlan aktif mi?
        deadline: u64,                          // Son başvuru tarihi (milisaniye cinsinden)
    }

    /// Represents a candidate's application as a dynamic object
    /// Adayın başvurusunu dinamik obje olarak temsil eder
    public struct ApplicationProfile has key, store {
        id: UID,
        candidate: address,          // Aday adresi
        user_profile_id: ID,         // Kullanıcı profili ID'si (YENİ)
        job_id: ID,                  // Başvurulan iş ilanı ID'si
        cover_message: String,       // Ön yazı mesajı
        timestamp: u64,              // Başvuru zamanı (milisaniye)
        cv_url: String,              // CV linki (obje içinde field olarak)
    }

    /// Key struct for storing ApplicationProfile as dynamic object field
    /// ApplicationProfile'ı dinamik obje alanı olarak saklamak için anahtar yapısı
    public struct ApplicationKey has copy, drop, store {
        candidate: address,          // Aday adresi
        index: u64,                  // Aynı adayın birden fazla başvurusunu destekler
    }

    /// Employer capability - proves ownership of a job
    /// İşveren yetkisi - bir iş ilanının sahipliğini kanıtlar
    public struct EmployerCap has key, store {
        id: UID,
        job_id: ID,                  // Bu yetki nesnesinin kontrol ettiği iş ilanı
    }

    /// User profile - contains basic information about a candidate/user
    /// Kullanıcı profili - aday/kullanıcının temel bilgilerini içerir
    public struct UserProfile has key, store {
        id: UID,
        user_address: address,       // Kullanıcı adresi
        name: String,                // Ad-Soyad
        bio: String,                 // Biyografi
        avatar_url: String,          // Profil fotoğrafı URL'i
        skills: vector<String>,      // Yetenekler
        experience_years: u64,       // Tecrübe yılı
        portfolio_url: String,       // Portfolio linki
        created_at: u64,             // Oluşturma zamanı
        updated_at: u64,             // Son güncelleme zamanı
    }

    /// Employer profile - contains information about a company/employer
    /// İşyeri profili - şirket/işverenin bilgilerini içerir
    public struct EmployerProfile has key, store {
        id: UID,
        employer_address: address,   // İşveren adresi
        company_name: String,        // Şirket adı
        description: String,         // Şirket açıklaması
        logo_url: String,            // Logo URL'i
        website: String,             // Web sitesi
        industry: String,            // Endüstri
        employee_count: u64,         // Çalışan sayısı
        founded_year: u64,           // Kuruluş yılı
        created_at: u64,             // Oluşturma zamanı
        updated_at: u64,             // Son güncelleme zamanı
    }

    /// Registry for all user profiles
    /// Tüm kullanıcı profillerinin kayıt defteri
    public struct UserRegistry has key {
        id: UID,
        user_profiles: vector<ID>,   // Tüm kullanıcı profil ID'leri
        user_count: u64,             // Toplam kullanıcı sayısı
    }

    /// Registry for all employer profiles
    /// Tüm işyeri profillerinin kayıt defteri
    public struct EmployerRegistry has key {
        id: UID,
        employer_profiles: vector<ID>, // Tüm işyeri profil ID'leri
        employer_count: u64,         // Toplam işyeri sayısı
    }

    // ====== Events ======
    // ====== Olaylar (Events) ======
    
    /// İş ilanı yayınlandığında tetiklenir
    public struct JobPosted has copy, drop {
        job_id: ID,                  // İlan ID'si
        employer: address,           // İşveren adresi
        title: String,               // İlan başlığı
        has_salary: bool,            // Maaş belirtildi mi?
        deadline: u64,               // Son başvuru tarihi
    }

    /// Başvuru yapıldığında tetiklenir
    public struct ApplicationSubmitted has copy, drop {
        job_id: ID,                  // İlan ID'si
        candidate: address,          // Aday adresi
        timestamp: u64,              // Başvuru zamanı
        application_id: ID,          // Başvuru profili ID'si
    }

    /// Aday işe alındığında tetiklenir
    public struct CandidateHired has copy, drop {
        job_id: ID,                  // İlan ID'si
        employer: address,           // İşveren adresi
        candidate: address,          // İşe alınan aday adresi
    }

    /// İş panosu oluşturulduğunda tetiklenir
    public struct JobBoardCreated has copy, drop {
        job_board_id: ID,            // İş panosu ID'si
    }

    /// Yükseltme yetkisi transfer edildiğinde tetiklenir
    public struct UpgradeCapTransferred has copy, drop {
        publisher_id: ID,            // Publisher objesi ID'si
        recipient: address,          // Yetki alan adres
    }

    /// Kullanıcı profili oluşturulduğunda tetiklenir
    public struct UserProfileCreated has copy, drop {
        user_profile_id: ID,         // Kullanıcı profili ID'si
        user_address: address,       // Kullanıcı adresi
        name: String,                // Ad-Soyad
    }

    /// İşyeri profili oluşturulduğunda tetiklenir
    public struct EmployerProfileCreated has copy, drop {
        employer_profile_id: ID,     // İşyeri profili ID'si
        employer_address: address,   // İşyeri adresi
        company_name: String,        // Şirket adı
    }

    /// Profil güncellendiğinde tetiklenir
    public struct ProfileUpdated has copy, drop {
        profile_id: ID,              // Profil ID'si
        profile_type: String,        // "user" veya "employer"
        updated_at: u64,             // Güncelleme zamanı
    }

    /// İş ilanı durumu değiştiğinde tetiklenir
    public struct JobStatusChanged has copy, drop {
        job_id: ID,                  // İlan ID'si
        employer: address,           // İşveren adresi
        is_active: bool,             // Yeni aktiflik durumu
    }

    // ====== Init Function ======
    // ====== Başlatma Fonksiyonu ======
    
    /// Initialize the shared JobBoard object and claim Publisher for upgrades
    /// Paylaşımlı JobBoard objesini başlat ve yükseltme için Publisher'ı talep et
    fun init(otw: MINIHUB, ctx: &mut TxContext) {
        // Create Publisher object for package upgrades
        // Paket yükseltmeleri için Publisher objesi oluştur
        let publisher = package::claim(otw, ctx);
        let publisher_id = object::id(&publisher);
        let sender = tx_context::sender(ctx);
        
        // Create shared job board
        // Paylaşımlı iş panosunu oluştur
        let job_board = JobBoard {
            id: object::new(ctx),
            job_count: 0,
            job_ids: vector::empty(),
        };
        
        // Create shared user registry
        // Paylaşımlı kullanıcı kayıt defterini oluştur
        let user_registry = UserRegistry {
            id: object::new(ctx),
            user_profiles: vector::empty(),
            user_count: 0,
        };
        
        // Create shared employer registry
        // Paylaşımlı işyeri kayıt defterini oluştur
        let employer_registry = EmployerRegistry {
            id: object::new(ctx),
            employer_profiles: vector::empty(),
            employer_count: 0,
        };
        
        let job_board_id = object::id(&job_board);
        let user_registry_id = object::id(&user_registry);
        let employer_registry_id = object::id(&employer_registry);
        
        // Paylaşımlı objeleri yayınla
        transfer::share_object(job_board);
        transfer::share_object(user_registry);
        transfer::share_object(employer_registry);
        
        // Transfer Publisher to deployer for upgrade control
        // Publisher'ı deploy eden kişiye transfer et (yükseltme kontrolü için)
        transfer::public_transfer(publisher, sender);
        
        // Olayları yayınla
        event::emit(JobBoardCreated {
            job_board_id,
        });
        
        event::emit(UpgradeCapTransferred {
            publisher_id,
            recipient: sender,
        });
    }

    // ====== Public Entry Functions ======
    // ====== Genel Fonksiyonlar ======
    
    /// Employer posts a new job
    /// İşveren yeni bir iş ilanı yayınlar
    #[allow(lint(self_transfer))]
    public fun post_job(
        job_board: &mut JobBoard,
        employer_profile: &EmployerProfile,
        title: String,
        description: String,
        salary: Option<u64>,
        deadline: u64,                   // Son başvuru tarihi (milisaniye cinsinden)
        ctx: &mut TxContext
    ) {
        // İşveren adresini al
        let employer = tx_context::sender(ctx);
        
        // Employer profili kontrolü - yalnızca kendi profilini kullanabilir
        // Employer profile control - can only use their own profile
        assert!(employer_profile.employer_address == employer, ENotAuthorized);
        
        let employer_profile_id = object::id(employer_profile);
        
        // Yeni iş ilanı oluştur
        let job = Job {
            id: object::new(ctx),
            employer,
            employer_profile_id,
            title,
            description,
            salary,
            application_count: 0,
            hired_candidate: option::none(),
            is_active: true,
            deadline,
        };
        
        let job_id = object::id(&job);
        
        // Create employer capability for access control
        // Erişim kontrolü için işveren yetkisi oluştur
        let employer_cap = EmployerCap {
            id: object::new(ctx),
            job_id,
        };
        
        // Track job in the board
        // İlanı panoda takip et
        vector::push_back(&mut job_board.job_ids, job_id);
        job_board.job_count = job_board.job_count + 1;
        
        // Emit event
        // Olay yayınla
        event::emit(JobPosted {
            job_id,
            employer,
            title,
            has_salary: option::is_some(&salary),
            deadline,
        });
        
        // Transfer capability to employer and share job object
        // Yetki nesnesini işverene transfer et ve iş ilanını paylaş
        transfer::transfer(employer_cap, employer);
        transfer::share_object(job);
    }

    /// Candidate submits an application to a job with CV URL
    /// Aday CV URL'i ile bir işe başvurur
    public fun apply_to_job(
        job: &mut Job,
        user_profile: &UserProfile,
        cover_message: String,
        cv_url: String,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        // Aday adresini ve şu anki zamanı al
        let candidate = tx_context::sender(ctx);
        let current_time = sui::clock::timestamp_ms(clock);
        
        // User profili kontrolü - yalnızca kendi profilini kullanabilir
        // User profile control - can only use their own profile
        assert!(user_profile.user_address == candidate, ENotAuthorized);
        
        // Check if deadline has passed
        // Son başvuru tarihinin geçip geçmediğini kontrol et
        assert!(current_time <= job.deadline, EDeadlinePassed);
        
        // Check if job is still active
        // İlanın hala aktif olup olmadığını kontrol et
        assert!(job.is_active, EJobAlreadyFilled);
        
        // Check if position is not already filled
        // Pozisyonun dolu olmadığını kontrol et
        assert!(option::is_none(&job.hired_candidate), EJobAlreadyFilled);
        
        let job_id = object::id(job);
        let user_profile_id = object::id(user_profile);
        
        // Create ApplicationProfile as a dynamic object
        // ApplicationProfile'ı dinamik obje olarak oluştur
        let application = ApplicationProfile {
            id: object::new(ctx),
            candidate,
            user_profile_id,
            job_id,
            cover_message,
            timestamp: current_time,
            cv_url,
        };
        
        let application_id = object::id(&application);
        
        // Add as dynamic object field to the job
        // İş ilanına dinamik obje alanı olarak ekle
        let key = ApplicationKey {
            candidate,
            index: job.application_count,
        };
        
        dynamic_object_field::add(&mut job.id, key, application);
        
        // Başvuru sayısını artır
        job.application_count = job.application_count + 1;
        
        // Olay yayınla
        event::emit(ApplicationSubmitted {
            job_id,
            candidate,
            timestamp: current_time,
            application_id,
        });
    }

    /// Employer hires a candidate (access control via EmployerCap)
    /// İşveren bir adayı işe alır (EmployerCap ile erişim kontrolü)
    public fun hire_candidate(
        job: &mut Job,
        employer_cap: &EmployerCap,
        candidate_address: address,
        candidate_index: u64,            // Adayın başvuru indeksi
        ctx: &mut TxContext
    ) {
        let employer = tx_context::sender(ctx);
        
        // Access control: verify employer owns this job via capability
        // Erişim kontrolü: işverenin bu ilanın sahibi olduğunu yetki ile doğrula
        assert!(employer_cap.job_id == object::id(job), ENotAuthorized);
        assert!(job.employer == employer, ENotAuthorized);
        
        // Check if position is not already filled
        // Pozisyonun dolu olmadığını kontrol et
        assert!(option::is_none(&job.hired_candidate), EJobAlreadyFilled);
        
        // Verify the application exists as a dynamic object field
        // Başvurunun dinamik obje alanı olarak var olduğunu doğrula
        let key = ApplicationKey {
            candidate: candidate_address,
            index: candidate_index,
        };
        
        assert!(dynamic_object_field::exists_(&job.id, key), EInvalidApplication);
        
        // Hire the candidate
        // Adayı işe al
        job.hired_candidate = option::some(candidate_address);
        job.is_active = false;
        
        // Olay yayınla
        event::emit(CandidateHired {
            job_id: object::id(job),
            employer,
            candidate: candidate_address,
        });
    }

    

    /// Employer disables/enables a job (access control via EmployerCap)
    /// İşveren bir iş ilanını devre dışı bırakır/etkinleştirir (EmployerCap ile erişim kontrolü)
    public fun set_job_active_status(
        job: &mut Job,
        employer_cap: &EmployerCap,
        is_active: bool,
        ctx: &mut TxContext
    ) {
        let employer = tx_context::sender(ctx);
        
        // Access control: verify employer owns this job via capability
        // Erişim kontrolü: işverenin bu ilanın sahibi olduğunu yetki ile doğrula
        assert!(employer_cap.job_id == object::id(job), ENotAuthorized);
        assert!(job.employer == employer, ENotAuthorized);
        
        // Update job status
        // İş ilanı durumunu güncelle
        job.is_active = is_active;
        
        // Emit event
        // Olay yayınla
        event::emit(JobStatusChanged {
            job_id: object::id(job),
            employer,
            is_active,
        });
    }

    // ====== Profile Management Functions ======
    // ====== Profil Yönetim Fonksiyonları ======
    
    /// Create a new user profile
    /// Yeni bir kullanıcı profili oluştur
    #[allow(lint(self_transfer))]
    public fun create_user_profile(
        user_registry: &mut UserRegistry,
        name: String,
        bio: String,
        avatar_url: String,
        skills: vector<String>,
        experience_years: u64,
        portfolio_url: String,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let user_address = tx_context::sender(ctx);
        let current_time = sui::clock::timestamp_ms(clock);
        
        let user_profile = UserProfile {
            id: object::new(ctx),
            user_address,
            name,
            bio,
            avatar_url,
            skills,
            experience_years,
            portfolio_url,
            created_at: current_time,
            updated_at: current_time,
        };
        
        let user_profile_id = object::id(&user_profile);
        
        // Registry'ye ekle
        vector::push_back(&mut user_registry.user_profiles, user_profile_id);
        user_registry.user_count = user_registry.user_count + 1;
        
        // Olay yayınla
        event::emit(UserProfileCreated {
            user_profile_id,
            user_address,
            name,
        });
        
        // Profili kullanıcıya transfer et
        transfer::share_object(user_profile);
    }

    /// Create a new employer profile
    /// Yeni bir işyeri profili oluştur
    #[allow(lint(self_transfer))]
    public fun create_employer_profile(
        employer_registry: &mut EmployerRegistry,
        company_name: String,
        description: String,
        logo_url: String,
        website: String,
        industry: String,
        employee_count: u64,
        founded_year: u64,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let employer_address = tx_context::sender(ctx);
        let current_time = sui::clock::timestamp_ms(clock);
        
        let employer_profile = EmployerProfile {
            id: object::new(ctx),
            employer_address,
            company_name,
            description,
            logo_url,
            website,
            industry,
            employee_count,
            founded_year,
            created_at: current_time,
            updated_at: current_time,
        };
        
        let employer_profile_id = object::id(&employer_profile);
        
        // Registry'ye ekle
        vector::push_back(&mut employer_registry.employer_profiles, employer_profile_id);
        employer_registry.employer_count = employer_registry.employer_count + 1;
        
        // Olay yayınla
        event::emit(EmployerProfileCreated {
            employer_profile_id,
            employer_address,
            company_name,
        });
        
        // Profili işverene transfer et
        transfer::share_object(employer_profile);
    }

    /// Update user profile information
    /// Kullanıcı profili bilgilerini güncelle
    public fun update_user_profile(
        user_profile: &mut UserProfile,
        name: String,
        bio: String,
        avatar_url: String,
        skills: vector<String>,
        experience_years: u64,
        portfolio_url: String,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        
        // Profil sahibi kontrolü
        assert!(user_profile.user_address == caller, ENotAuthorized);
        
        let current_time = sui::clock::timestamp_ms(clock);
        
        user_profile.name = name;
        user_profile.bio = bio;
        user_profile.avatar_url = avatar_url;
        user_profile.skills = skills;
        user_profile.experience_years = experience_years;
        user_profile.portfolio_url = portfolio_url;
        user_profile.updated_at = current_time;
        
        // Güncelleme olayını yayınla
        event::emit(ProfileUpdated {
            profile_id: object::id(user_profile),
            profile_type: std::string::utf8(b"user"),
            updated_at: current_time,
        });
    }

    /// Update employer profile information
    /// İşyeri profili bilgilerini güncelle
    public fun update_employer_profile(
        employer_profile: &mut EmployerProfile,
        company_name: String,
        description: String,
        logo_url: String,
        website: String,
        industry: String,
        employee_count: u64,
        founded_year: u64,
        clock: &sui::clock::Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        
        // Profil sahibi kontrolü
        assert!(employer_profile.employer_address == caller, ENotAuthorized);
        
        let current_time = sui::clock::timestamp_ms(clock);
        
        employer_profile.company_name = company_name;
        employer_profile.description = description;
        employer_profile.logo_url = logo_url;
        employer_profile.website = website;
        employer_profile.industry = industry;
        employer_profile.employee_count = employee_count;
        employer_profile.founded_year = founded_year;
        employer_profile.updated_at = current_time;
        
        // Güncelleme olayını yayınla
        event::emit(ProfileUpdated {
            profile_id: object::id(employer_profile),
            profile_type: std::string::utf8(b"employer"),
            updated_at: current_time,
        });
    }

    // ====== View Functions ======
    // ====== Görüntüleme Fonksiyonları ======
    
    /// Get job details
    /// İş ilanı detaylarını al
    public fun get_job_info(job: &Job): (address, ID, String, String, Option<u64>, bool, Option<address>, u64) {
        (
            job.employer,               // İşveren adresi
            job.employer_profile_id,    // İşveren profili ID'si
            job.title,                  // Başlık
            job.description,            // Açıklama
            job.salary,                 // Maaş
            job.is_active,              // Aktif mi?
            job.hired_candidate,        // İşe alınan aday
            job.deadline                // Son başvuru tarihi
        )
    }

    /// Get number of applications for a job
    /// Bir iş ilanına yapılan başvuru sayısını al
    public fun get_application_count(job: &Job): u64 {
        job.application_count
    }

    /// Get a specific application by candidate and index
    /// Aday ve indekse göre belirli bir başvuruyu al
    public fun get_application(job: &Job, candidate: address, index: u64): &ApplicationProfile {
        let key = ApplicationKey {
            candidate,
            index,
        };
        dynamic_object_field::borrow(&job.id, key)
    }

    /// Get application profile details
    /// Başvuru profili detaylarını al
    public fun get_application_info(app: &ApplicationProfile): (address, ID, ID, String, u64, String) {
        (
            app.candidate,          // Aday adresi
            app.user_profile_id,    // Kullanıcı profili ID'si
            app.job_id,             // İş ilanı ID'si
            app.cover_message,      // Ön yazı
            app.timestamp,          // Zaman damgası
            app.cv_url              // CV linki
        )
    }

    /// Check if a job has been filled
    /// İlanın dolu olup olmadığını kontrol et
    public fun is_job_filled(job: &Job): bool {
        option::is_some(&job.hired_candidate)
    }

    /// Get user profile details
    /// Kullanıcı profili detaylarını al
    public fun get_user_profile_info(profile: &UserProfile): (address, String, String, String, vector<String>, u64, String, u64, u64) {
        (
            profile.user_address,       // Adresi
            profile.name,               // Adı
            profile.bio,                // Biyografisi
            profile.avatar_url,         // Profil fotoğrafı
            profile.skills,             // Yetenekleri
            profile.experience_years,   // Tecrübe yılı
            profile.portfolio_url,      // Portfolio linki
            profile.created_at,         // Oluşturma zamanı
            profile.updated_at          // Güncelleme zamanı
        )
    }

    /// Get employer profile details
    /// İşyeri profili detaylarını al
    public fun get_employer_profile_info(profile: &EmployerProfile): (address, String, String, String, String, String, u64, u64, u64, u64) {
        (
            profile.employer_address,   // İşyeri adresi
            profile.company_name,       // Şirket adı
            profile.description,        // Açıklama
            profile.logo_url,           // Logo
            profile.website,            // Web sitesi
            profile.industry,           // Endüstri
            profile.employee_count,     // Çalışan sayısı
            profile.founded_year,       // Kuruluş yılı
            profile.created_at,         // Oluşturma zamanı
            profile.updated_at          // Güncelleme zamanı
        )
    }

    /// Get total number of registered users
    /// Kayıtlı toplam kullanıcı sayısını al
    public fun get_total_users(registry: &UserRegistry): u64 {
        registry.user_count
    }

    /// Get total number of registered employers
    /// Kayıtlı toplam işyeri sayısını al
    public fun get_total_employers(registry: &EmployerRegistry): u64 {
        registry.employer_count
    }

    /// Get total number of jobs on the board
    /// Panodaki toplam iş ilanı sayısını al
    public fun get_total_jobs(job_board: &JobBoard): u64 {
        job_board.job_count
    }
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        let otw = MINIHUB {};
        init(otw, ctx);
    }
}


