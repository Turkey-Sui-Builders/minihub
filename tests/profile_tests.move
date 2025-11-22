#[test_only]
module minihub::profile_tests {
    use minihub::minihub::{
        Self,
        UserProfile,
        EmployerProfile,
        UserRegistry,
        EmployerRegistry,
    };
    use minihub::test_helpers::{Self};
    use sui::test_scenario::{Self as ts};
    use sui::clock;
    
    #[test]
    fun test_create_user_profile() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        // UserRegistry'yi al
        ts::next_tx(&mut scenario, @candidate1);
        let mut user_registry = ts::take_shared<UserRegistry>(&scenario);
        
        // Kullanıcı profili oluştur
        let skills = vector[test_helpers::utf8(b"Rust"), test_helpers::utf8(b"Move"), test_helpers::utf8(b"Blockchain")];
        minihub::create_user_profile(
            &mut user_registry,
            test_helpers::utf8(b"Ali Yilmaz"),
            test_helpers::utf8(b"Experienced blockchain developer"),
            test_helpers::utf8(b"https://avatar.com/ali.jpg"),
            skills,
            5,
            test_helpers::utf8(b"https://portfolio.com/ali"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(user_registry);
        
        // Profili kontrol et
        ts::next_tx(&mut scenario, @candidate1);
        let user_profile = ts::take_shared<UserProfile>(&scenario);
        
        let (addr, name, bio, avatar, skills, exp, portfolio, created, updated) = 
            minihub::get_user_profile_info(&user_profile);
        
        assert!(addr == @candidate1, 0);
        assert!(name == test_helpers::utf8(b"Ali Yilmaz"), 1);
        assert!(bio == test_helpers::utf8(b"Experienced blockchain developer"), 2);
        assert!(exp == 5, 3);
        assert!(created == updated, 4); // İlk oluşturma
        
        ts::return_shared(user_profile);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
    
    #[test]
    fun test_create_employer_profile() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        // EmployerRegistry'yi al
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        // İşyeri profili oluştur
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"TechCorp"),
            test_helpers::utf8(b"Leading blockchain company"),
            test_helpers::utf8(b"https://logo.com/techcorp.png"),
            test_helpers::utf8(b"https://techcorp.com"),
            test_helpers::utf8(b"Blockchain Technology"),
            50,
            2020,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(employer_registry);
        
        // Profili kontrol et
        ts::next_tx(&mut scenario, @employer1);
        let employer_profile = ts::take_shared<EmployerProfile>(&scenario);
        
        let (addr, company_name, desc, logo, website, industry, emp_count, founded, created, updated) = 
            minihub::get_employer_profile_info(&employer_profile);
        
        assert!(addr == @employer1, 0);
        assert!(company_name == test_helpers::utf8(b"TechCorp"), 1);
        assert!(industry == test_helpers::utf8(b"Blockchain Technology"), 2);
        assert!(emp_count == 50, 3);
        assert!(founded == 2020, 4);
        
        ts::return_shared(employer_profile);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
    
    #[test]
    fun test_update_user_profile() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        // Profil oluştur
        ts::next_tx(&mut scenario, @candidate1);
        let mut user_registry = ts::take_shared<UserRegistry>(&scenario);
        
        let skills = vector[test_helpers::utf8(b"Rust")];
        minihub::create_user_profile(
            &mut user_registry,
            test_helpers::utf8(b"Old Name"),
            test_helpers::utf8(b"Old Bio"),
            test_helpers::utf8(b"old_avatar.jpg"),
            skills,
            3,
            test_helpers::utf8(b"old_portfolio.com"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(user_registry);
        
        // Profili güncelle
        ts::next_tx(&mut scenario, @candidate1);
        let mut user_profile = ts::take_shared<UserProfile>(&scenario);
        
        clock::increment_for_testing(&mut clock, 1000); // 1 saniye sonra
        
        let new_skills = vector[test_helpers::utf8(b"Rust"), test_helpers::utf8(b"Move"), test_helpers::utf8(b"Solidity")];
        minihub::update_user_profile(
            &mut user_profile,
            test_helpers::utf8(b"New Name"),
            test_helpers::utf8(b"New Bio"),
            test_helpers::utf8(b"new_avatar.jpg"),
            new_skills,
            5,
            test_helpers::utf8(b"new_portfolio.com"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        let (_, name, bio, _, skills, exp, _, created, updated) = 
            minihub::get_user_profile_info(&user_profile);
        
        assert!(name == test_helpers::utf8(b"New Name"), 0);
        assert!(bio == test_helpers::utf8(b"New Bio"), 1);
        assert!(exp == 5, 2);
        assert!(updated > created, 3); // Güncelleme zamanı farklı olmalı
        
        ts::return_shared(user_profile);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
    
    #[test]
    fun test_update_employer_profile() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        // Profil oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Old Company"),
            test_helpers::utf8(b"Old Description"),
            test_helpers::utf8(b"old_logo.png"),
            test_helpers::utf8(b"old.com"),
            test_helpers::utf8(b"Old Industry"),
            10,
            2015,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(employer_registry);
        
        // Profili güncelle
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_profile = ts::take_shared<EmployerProfile>(&scenario);
        
        clock::increment_for_testing(&mut clock, 2000); // 2 saniye sonra
        
        minihub::update_employer_profile(
            &mut employer_profile,
            test_helpers::utf8(b"New Company"),
            test_helpers::utf8(b"New Description"),
            test_helpers::utf8(b"new_logo.png"),
            test_helpers::utf8(b"new.com"),
            test_helpers::utf8(b"New Industry"),
            100,
            2020,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        let (_, company_name, desc, _, website, industry, emp_count, founded, created, updated) = 
            minihub::get_employer_profile_info(&employer_profile);
        
        assert!(company_name == test_helpers::utf8(b"New Company"), 0);
        assert!(industry == test_helpers::utf8(b"New Industry"), 1);
        assert!(emp_count == 100, 2);
        assert!(founded == 2020, 3);
        assert!(updated > created, 4);
        
        ts::return_shared(employer_profile);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 1)]
    fun test_update_wrong_user_profile_fails() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        // @candidate1 profil oluşturur
        ts::next_tx(&mut scenario, @candidate1);
        let mut user_registry = ts::take_shared<UserRegistry>(&scenario);
        
        let skills = vector[test_helpers::utf8(b"Rust")];
        minihub::create_user_profile(
            &mut user_registry,
            test_helpers::utf8(b"User One"),
            test_helpers::utf8(b"Bio"),
            test_helpers::utf8(b"avatar.jpg"),
            skills,
            3,
            test_helpers::utf8(b"portfolio.com"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(user_registry);
        
        // @candidate2 başkasının profilini güncellemeye çalışır - BAŞARISIZ OLMALI
        ts::next_tx(&mut scenario, @candidate2);
        let mut user_profile = ts::take_shared<UserProfile>(&scenario);
        
        let new_skills = vector[test_helpers::utf8(b"Hacking")];
        minihub::update_user_profile(
            &mut user_profile,
            test_helpers::utf8(b"Hacker"),
            test_helpers::utf8(b"Evil bio"),
            test_helpers::utf8(b"evil.jpg"),
            new_skills,
            10,
            test_helpers::utf8(b"evil.com"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(user_profile);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_zero_experience_profile() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        ts::next_tx(&mut scenario, @candidate1);
        let mut user_registry = ts::take_shared<UserRegistry>(&scenario);
        
        // 0 yıl deneyimle profil oluştur
        let skills = vector[test_helpers::utf8(b"Move")];
        minihub::create_user_profile(
            &mut user_registry,
            test_helpers::utf8(b"Junior Dev"),
            test_helpers::utf8(b"Fresh graduate"),
            test_helpers::utf8(b"avatar.jpg"),
            skills,
            0, // Sıfır deneyim
            test_helpers::utf8(b"portfolio.com"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(user_registry);
        
        ts::next_tx(&mut scenario, @candidate1);
        let user_profile = ts::take_shared<UserProfile>(&scenario);
        
        let (_, _, _, _, _, exp, _, _, _) = minihub::get_user_profile_info(&user_profile);
        assert!(exp == 0, 0);
        
        ts::return_shared(user_profile);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
}
