#[test_only]
module minihub::edge_case_tests {
    use minihub::minihub::{
        Self,
        JobBoard,
        Job,
        EmployerCap,
        UserProfile,
        EmployerProfile,
        UserRegistry,
        EmployerRegistry,
    };
    use minihub::test_helpers::{Self};
    use sui::test_scenario::{Self as ts};
    use sui::clock;
    use std::option;
    
    #[test]
    fun test_get_application_details() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let clock = test_helpers::create_clock(&mut scenario);
        
        // Profiller oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Tech Corp"),
            test_helpers::utf8(b"Tech company"),
            test_helpers::utf8(b"logo.png"),
            test_helpers::utf8(b"techcorp.com"),
            test_helpers::utf8(b"Tech"),
            50,
            2015,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(employer_registry);
        
        ts::next_tx(&mut scenario, @candidate1);
        let mut user_registry = ts::take_shared<UserRegistry>(&scenario);
        
        minihub::create_user_profile(
            &mut user_registry,
            test_helpers::utf8(b"Alice Johnson"),
            test_helpers::utf8(b"Senior Developer"),
            test_helpers::utf8(b"alice.jpg"),
            vector[test_helpers::utf8(b"Rust"), test_helpers::utf8(b"Move")],
            5,
            test_helpers::utf8(b"alice.dev"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(user_registry);
        
        // İş ilanı oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut job_board = ts::take_shared<JobBoard>(&scenario);
        let employer_profile = ts::take_shared<EmployerProfile>(&scenario);
        
        let deadline = clock::timestamp_ms(&clock) + 30 * 24 * 60 * 60 * 1000;
        
        minihub::post_job(
            &mut job_board,
            &employer_profile,
            test_helpers::utf8(b"Rust Engineer"),
            test_helpers::utf8(b"Senior position"),
            option::some(180000),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        
        // Başvuru yap
        ts::next_tx(&mut scenario, @candidate1);
        let mut job = ts::take_shared<Job>(&scenario);
        let user_profile = ts::take_shared<UserProfile>(&scenario);
        
        let cover_msg = test_helpers::utf8(b"I have 5 years of Rust experience and would love to join your team!");
        let cv_link = test_helpers::utf8(b"https://alice.dev/cv.pdf");
        
        minihub::apply_to_job(
            &mut job,
            &user_profile,
            cover_msg,
            cv_link,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        // Başvuru detaylarını kontrol et
        let app = minihub::get_application(&job, @candidate1, 0);
        let (candidate, _, _, cover, _, cv_url) = minihub::get_application_info(app);
        
        assert!(candidate == @candidate1, 0);
        assert!(cover == cover_msg, 1);
        assert!(cv_url == cv_link, 2);
        
        ts::return_shared(job);
        ts::return_shared(user_profile);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
    
    #[test]
    fun test_job_is_active_after_posting() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let clock = test_helpers::create_clock(&mut scenario);
        
        // İşveren profili oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Active Company"),
            test_helpers::utf8(b"Always hiring"),
            test_helpers::utf8(b"logo.png"),
            test_helpers::utf8(b"active.com"),
            test_helpers::utf8(b"Recruiting"),
            100,
            2010,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(employer_registry);
        
        // İş ilanı oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut job_board = ts::take_shared<JobBoard>(&scenario);
        let employer_profile = ts::take_shared<EmployerProfile>(&scenario);
        
        let deadline = clock::timestamp_ms(&clock) + 60 * 24 * 60 * 60 * 1000; // 60 gün
        
        minihub::post_job(
            &mut job_board,
            &employer_profile,
            test_helpers::utf8(b"Always Open Position"),
            test_helpers::utf8(b"We are always looking for talent"),
            option::some(150000),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        
        // İlan durumunu kontrol et
        ts::next_tx(&mut scenario, @candidate1);
        let job = ts::take_shared<Job>(&scenario);
        
        let (_, _, _, _, _, is_active, hired, _) = minihub::get_job_info(&job);
        
        assert!(is_active, 0);
        assert!(option::is_none(&hired), 1);
        assert!(!minihub::is_job_filled(&job), 2);
        
        ts::return_shared(job);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
    
    #[test]
    fun test_job_becomes_inactive_after_hiring() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let clock = test_helpers::create_clock(&mut scenario);
        
        // Profiller oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Quick Hire Inc"),
            test_helpers::utf8(b"Fast hiring"),
            test_helpers::utf8(b"logo.png"),
            test_helpers::utf8(b"quickhire.com"),
            test_helpers::utf8(b"HR"),
            20,
            2020,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(employer_registry);
        
        ts::next_tx(&mut scenario, @candidate1);
        let mut user_registry = ts::take_shared<UserRegistry>(&scenario);
        
        minihub::create_user_profile(
            &mut user_registry,
            test_helpers::utf8(b"Quick Candidate"),
            test_helpers::utf8(b"Ready to start"),
            test_helpers::utf8(b"avatar.jpg"),
            vector[test_helpers::utf8(b"Fast Learner")],
            2,
            test_helpers::utf8(b"portfolio.com"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(user_registry);
        
        // İş ilanı oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut job_board = ts::take_shared<JobBoard>(&scenario);
        let employer_profile = ts::take_shared<EmployerProfile>(&scenario);
        
        let deadline = clock::timestamp_ms(&clock) + 7 * 24 * 60 * 60 * 1000;
        
        minihub::post_job(
            &mut job_board,
            &employer_profile,
            test_helpers::utf8(b"Urgent Position"),
            test_helpers::utf8(b"Need to fill ASAP"),
            option::some(100000),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        
        // Başvuru ve işe alma
        ts::next_tx(&mut scenario, @candidate1);
        let mut job = ts::take_shared<Job>(&scenario);
        let user_profile = ts::take_shared<UserProfile>(&scenario);
        
        minihub::apply_to_job(
            &mut job,
            &user_profile,
            test_helpers::utf8(b"I can start immediately!"),
            test_helpers::utf8(b"cv.pdf"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job);
        ts::return_shared(user_profile);
        
        ts::next_tx(&mut scenario, @employer1);
        let mut job = ts::take_shared<Job>(&scenario);
        let employer_cap = ts::take_from_sender<EmployerCap>(&scenario);
        
        minihub::hire_candidate(
            &mut job,
            &employer_cap,
            @candidate1,
            0,
            ts::ctx(&mut scenario)
        );
        
        // İşe alındıktan sonra durumu kontrol et
        let (_, _, _, _, _, is_active, hired, _) = minihub::get_job_info(&job);
        
        assert!(!is_active, 0); // Artık aktif değil
        assert!(option::is_some(&hired), 1);
        assert!(*option::borrow(&hired) == @candidate1, 2);
        assert!(minihub::is_job_filled(&job), 3);
        
        ts::return_shared(job);
        ts::return_to_sender(&scenario, employer_cap);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
    
    #[test]
    fun test_application_count_increments() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let clock = test_helpers::create_clock(&mut scenario);
        
        // Profiller oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Popular Company"),
            test_helpers::utf8(b"Everyone wants to work here"),
            test_helpers::utf8(b"logo.png"),
            test_helpers::utf8(b"popular.com"),
            test_helpers::utf8(b"Tech"),
            500,
            2005,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(employer_registry);
        
        // İş ilanı oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut job_board = ts::take_shared<JobBoard>(&scenario);
        let employer_profile = ts::take_shared<EmployerProfile>(&scenario);
        
        let deadline = clock::timestamp_ms(&clock) + 30 * 24 * 60 * 60 * 1000;
        
        minihub::post_job(
            &mut job_board,
            &employer_profile,
            test_helpers::utf8(b"Dream Job"),
            test_helpers::utf8(b"Best position ever"),
            option::some(200000),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        
        // İlk başta 0 başvuru
        ts::next_tx(&mut scenario, @admin);
        let job = ts::take_shared<Job>(&scenario);
        assert!(minihub::get_application_count(&job) == 0, 0);
        ts::return_shared(job);
        
        // 5 aday başvursun
        let candidates = vector[@candidate1, @candidate2, @candidate3, @0xC4, @0xC5];
        let mut i = 0;
        while (i < 5) {
            let candidate = *vector::borrow(&candidates, i);
            
            ts::next_tx(&mut scenario, candidate);
            let mut user_registry = ts::take_shared<UserRegistry>(&scenario);
            
            minihub::create_user_profile(
                &mut user_registry,
                test_helpers::utf8(b"Candidate"),
                test_helpers::utf8(b"Bio"),
                test_helpers::utf8(b"avatar.jpg"),
                vector[test_helpers::utf8(b"Skill")],
                i + 1,
                test_helpers::utf8(b"portfolio.com"),
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(user_registry);
            
            ts::next_tx(&mut scenario, candidate);
            let mut job = ts::take_shared<Job>(&scenario);
            let user_profile = ts::take_shared<UserProfile>(&scenario);
            
            minihub::apply_to_job(
                &mut job,
                &user_profile,
                test_helpers::utf8(b"Please hire me!"),
                test_helpers::utf8(b"cv.pdf"),
                &clock,
                ts::ctx(&mut scenario)
            );
            
            // Her başvuru sonrası sayıyı kontrol et
            assert!(minihub::get_application_count(&job) == i + 1, i + 1);
            
            ts::return_shared(job);
            ts::return_shared(user_profile);
            i = i + 1;
        };
        
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_multiple_skills_in_profile() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let clock = test_helpers::create_clock(&mut scenario);
        
        // Birçok yetenek ile kullanıcı profili oluştur
        ts::next_tx(&mut scenario, @candidate1);
        let mut user_registry = ts::take_shared<UserRegistry>(&scenario);
        
        let skills = vector[
            test_helpers::utf8(b"Rust"),
            test_helpers::utf8(b"Move"),
            test_helpers::utf8(b"TypeScript"),
            test_helpers::utf8(b"React"),
            test_helpers::utf8(b"Blockchain"),
            test_helpers::utf8(b"Smart Contracts"),
            test_helpers::utf8(b"Web3")
        ];
        
        minihub::create_user_profile(
            &mut user_registry,
            test_helpers::utf8(b"Full Stack Developer"),
            test_helpers::utf8(b"Expert in blockchain and web development"),
            test_helpers::utf8(b"avatar.jpg"),
            skills,
            7,
            test_helpers::utf8(b"portfolio.dev"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(user_registry);
        
        // Profili kontrol et
        ts::next_tx(&mut scenario, @candidate1);
        let user_profile = ts::take_shared<UserProfile>(&scenario);
        
        let (_, name, _, _, profile_skills, exp, _, _, _) = 
            minihub::get_user_profile_info(&user_profile);
        
        assert!(name == test_helpers::utf8(b"Full Stack Developer"), 0);
        assert!(exp == 7, 1);
        assert!(vector::length(&profile_skills) == 7, 2);
        
        ts::return_shared(user_profile);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
}
