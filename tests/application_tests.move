#[test_only]
module minihub::application_tests {
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
    fun test_apply_to_job_with_profile() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        // İşveren ve kullanıcı profillerini oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Company"),
            test_helpers::utf8(b"Description"),
            test_helpers::utf8(b"logo.png"),
            test_helpers::utf8(b"site.com"),
            test_helpers::utf8(b"Tech"),
            10,
            2020,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(employer_registry);
        
        ts::next_tx(&mut scenario, @candidate1);
        let mut user_registry = ts::take_shared<UserRegistry>(&scenario);
        
        minihub::create_user_profile(
            &mut user_registry,
            test_helpers::utf8(b"Candidate Name"),
            test_helpers::utf8(b"Bio"),
            test_helpers::utf8(b"avatar.jpg"),
            vector[test_helpers::utf8(b"Move")],
            3,
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
            test_helpers::utf8(b"Developer"),
            test_helpers::utf8(b"Job description"),
            option::some(100000),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        
        // Başvuru yap
        ts::next_tx(&mut scenario, @candidate1);
        let mut job = ts::take_shared<Job>(&scenario);
        let user_profile = ts::take_shared<UserProfile>(&scenario);
        
        minihub::apply_to_job(
            &mut job,
            &user_profile,
            test_helpers::utf8(b"I am very interested in this position"),
            test_helpers::utf8(b"https://cv.com/candidate1.pdf"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        assert!(minihub::get_application_count(&job) == 1, 0);
        
        // Başvuruyu kontrol et
        let app = minihub::get_application(&job, @candidate1, 0);
        let (candidate, user_profile_id, job_id, cover, timestamp, cv_url) = 
            minihub::get_application_info(app);
        
        assert!(candidate == @candidate1, 1);
        assert!(cover == test_helpers::utf8(b"I am very interested in this position"), 2);
        assert!(cv_url == test_helpers::utf8(b"https://cv.com/candidate1.pdf"), 3);
        
        ts::return_shared(job);
        ts::return_shared(user_profile);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_multiple_applications() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        // İşveren profili oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Company"),
            test_helpers::utf8(b"Desc"),
            test_helpers::utf8(b"logo.png"),
            test_helpers::utf8(b"site.com"),
            test_helpers::utf8(b"Tech"),
            10,
            2020,
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
            test_helpers::utf8(b"Move Developer"),
            test_helpers::utf8(b"Description"),
            option::some(120000),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        
        // 3 aday için profil oluştur ve başvursun
        let candidates = vector[@candidate1, @candidate2, @candidate3];
        let mut i = 0;
        while (i < 3) {
            let candidate = *vector::borrow(&candidates, i);
            
            // Her aday kendi profilini oluşturur
            ts::next_tx(&mut scenario, candidate);
            let mut user_registry = ts::take_shared<UserRegistry>(&scenario);
            
            minihub::create_user_profile(
                &mut user_registry,
                test_helpers::utf8(b"Candidate"),
                test_helpers::utf8(b"Bio"),
                test_helpers::utf8(b"avatar.jpg"),
                vector[test_helpers::utf8(b"Move")],
                2,
                test_helpers::utf8(b"portfolio.com"),
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(user_registry);
            
            // Hemen başvuru yap (aynı tx içinde değil, sonraki tx'te)
            ts::next_tx(&mut scenario, candidate);
            let mut job = ts::take_shared<Job>(&scenario);
            let user_profile = ts::take_shared<UserProfile>(&scenario);
            
            minihub::apply_to_job(
                &mut job,
                &user_profile,
                test_helpers::utf8(b"Cover letter"),
                test_helpers::utf8(b"cv_url.pdf"),
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(job);
            ts::return_shared(user_profile);
            i = i + 1;
        };
        
        // Başvuru sayısını kontrol et
        ts::next_tx(&mut scenario, @candidate1);
        let job = ts::take_shared<Job>(&scenario);
        
        assert!(minihub::get_application_count(&job) == 3, 0);
        
        ts::return_shared(job);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_hire_candidate() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        // Profiller oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Company"),
            test_helpers::utf8(b"Desc"),
            test_helpers::utf8(b"logo.png"),
            test_helpers::utf8(b"site.com"),
            test_helpers::utf8(b"Tech"),
            10,
            2020,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(employer_registry);
        
        ts::next_tx(&mut scenario, @candidate1);
        let mut user_registry = ts::take_shared<UserRegistry>(&scenario);
        
        minihub::create_user_profile(
            &mut user_registry,
            test_helpers::utf8(b"Candidate"),
            test_helpers::utf8(b"Bio"),
            test_helpers::utf8(b"avatar.jpg"),
            vector[test_helpers::utf8(b"Move")],
            3,
            test_helpers::utf8(b"portfolio.com"),
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
            test_helpers::utf8(b"Developer"),
            test_helpers::utf8(b"Description"),
            option::some(100000),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        
        // Başvuru yap
        ts::next_tx(&mut scenario, @candidate1);
        let mut job = ts::take_shared<Job>(&scenario);
        let user_profile = ts::take_shared<UserProfile>(&scenario);
        
        minihub::apply_to_job(
            &mut job,
            &user_profile,
            test_helpers::utf8(b"Cover letter"),
            test_helpers::utf8(b"cv.pdf"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job);
        ts::return_shared(user_profile);
        
        // İşe al
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
        
        assert!(minihub::is_job_filled(&job), 0);
        
        let (_, _, _, _, _, is_active, hired, _) = minihub::get_job_info(&job);
        assert!(!is_active, 1);
        assert!(option::is_some(&hired), 2);
        assert!(*option::borrow(&hired) == @candidate1, 3);
        
        ts::return_shared(job);
        ts::return_to_sender(&scenario, employer_cap);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 4)]
    fun test_apply_after_deadline_fails() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        // Profiller oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Company"),
            test_helpers::utf8(b"Desc"),
            test_helpers::utf8(b"logo.png"),
            test_helpers::utf8(b"site.com"),
            test_helpers::utf8(b"Tech"),
            10,
            2020,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(employer_registry);
        
        ts::next_tx(&mut scenario, @candidate1);
        let mut user_registry = ts::take_shared<UserRegistry>(&scenario);
        
        minihub::create_user_profile(
            &mut user_registry,
            test_helpers::utf8(b"Candidate"),
            test_helpers::utf8(b"Bio"),
            test_helpers::utf8(b"avatar.jpg"),
            vector[test_helpers::utf8(b"Move")],
            3,
            test_helpers::utf8(b"portfolio.com"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(user_registry);
        
        // İş ilanı oluştur (kısa deadline)
        ts::next_tx(&mut scenario, @employer1);
        let mut job_board = ts::take_shared<JobBoard>(&scenario);
        let employer_profile = ts::take_shared<EmployerProfile>(&scenario);
        
        let deadline = clock::timestamp_ms(&clock) + 1000; // 1 saniye
        
        minihub::post_job(
            &mut job_board,
            &employer_profile,
            test_helpers::utf8(b"Developer"),
            test_helpers::utf8(b"Description"),
            option::some(100000),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        
        // Zamanı deadline'dan sonraya al
        clock::increment_for_testing(&mut clock, 2000);
        
        // Başvuru yap (başarısız olmalı)
        ts::next_tx(&mut scenario, @candidate1);
        let mut job = ts::take_shared<Job>(&scenario);
        let user_profile = ts::take_shared<UserProfile>(&scenario);
        
        minihub::apply_to_job(
            &mut job,
            &user_profile,
            test_helpers::utf8(b"Cover letter"),
            test_helpers::utf8(b"cv.pdf"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job);
        ts::return_shared(user_profile);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 2)]
    fun test_apply_to_filled_job_fails() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        // Profiller oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Company"),
            test_helpers::utf8(b"Desc"),
            test_helpers::utf8(b"logo.png"),
            test_helpers::utf8(b"site.com"),
            test_helpers::utf8(b"Tech"),
            10,
            2020,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(employer_registry);
        
        ts::next_tx(&mut scenario, @candidate1);
        let mut user_registry = ts::take_shared<UserRegistry>(&scenario);
        
        minihub::create_user_profile(
            &mut user_registry,
            test_helpers::utf8(b"Candidate1"),
            test_helpers::utf8(b"Bio"),
            test_helpers::utf8(b"avatar.jpg"),
            vector[test_helpers::utf8(b"Move")],
            3,
            test_helpers::utf8(b"portfolio.com"),
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
            test_helpers::utf8(b"Developer"),
            test_helpers::utf8(b"Description"),
            option::some(100000),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        
        // Candidate1 başvursun
        ts::next_tx(&mut scenario, @candidate1);
        let mut job = ts::take_shared<Job>(&scenario);
        let user_profile = ts::take_shared<UserProfile>(&scenario);
        
        minihub::apply_to_job(
            &mut job,
            &user_profile,
            test_helpers::utf8(b"Cover letter"),
            test_helpers::utf8(b"cv.pdf"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job);
        ts::return_shared(user_profile);
        
        // Candidate1'i işe al
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
        
        ts::return_shared(job);
        ts::return_to_sender(&scenario, employer_cap);
        
        // Candidate1 tekrar başvursun (başarısız olmalı - pozisyon dolu)
        ts::next_tx(&mut scenario, @candidate1);
        let mut job = ts::take_shared<Job>(&scenario);
        let user_profile = ts::take_shared<UserProfile>(&scenario);
        
        minihub::apply_to_job(
            &mut job,
            &user_profile,
            test_helpers::utf8(b"Cover letter 2"),
            test_helpers::utf8(b"cv2.pdf"),
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job);
        ts::return_shared(user_profile);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 3)]
    fun test_cannot_hire_without_application() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let clock = test_helpers::create_clock(&mut scenario);
        
        // Profil oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Company"),
            test_helpers::utf8(b"Desc"),
            test_helpers::utf8(b"logo.png"),
            test_helpers::utf8(b"site.com"),
            test_helpers::utf8(b"Tech"),
            10,
            2020,
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
            test_helpers::utf8(b"Developer"),
            test_helpers::utf8(b"Desc"),
            option::some(100000),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        
        // Başvuru olmadan işe almaya çalış (başarısız olmalı)
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
        
        ts::return_shared(job);
        ts::return_to_sender(&scenario, employer_cap);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
}
