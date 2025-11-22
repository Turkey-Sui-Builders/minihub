#[test_only]
module minihub::job_posting_tests {
    use minihub::minihub::{
        Self,
        JobBoard,
        Job,
        EmployerProfile,
        EmployerRegistry,
        UserRegistry,
    };
    use minihub::test_helpers::{Self};
    use sui::test_scenario::{Self as ts};
    use sui::clock;
    use std::option;
    
    #[test]
    fun test_post_job_with_profile() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        // İşveren profili oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Tech Company"),
            test_helpers::utf8(b"We build stuff"),
            test_helpers::utf8(b"logo.png"),
            test_helpers::utf8(b"tech.com"),
            test_helpers::utf8(b"Technology"),
            25,
            2018,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(employer_registry);
        
        // İş ilanı oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut job_board = ts::take_shared<JobBoard>(&scenario);
        let employer_profile = ts::take_shared<EmployerProfile>(&scenario);
        
        let deadline = clock::timestamp_ms(&clock) + 7 * 24 * 60 * 60 * 1000; // 7 gün sonra
        
        minihub::post_job(
            &mut job_board,
            &employer_profile,
            test_helpers::utf8(b"Senior Move Developer"),
            test_helpers::utf8(b"We need an experienced Move developer"),
            option::some(150000),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        assert!(minihub::get_total_jobs(&job_board) == 1, 0);
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        
        // İş ilanını kontrol et
        ts::next_tx(&mut scenario, @employer1);
        let job = ts::take_shared<Job>(&scenario);
        
        let (employer, employer_profile_id, title, desc, salary, is_active, hired, deadline_check) = 
            minihub::get_job_info(&job);
        
        assert!(employer == @employer1, 1);
        assert!(title == test_helpers::utf8(b"Senior Move Developer"), 2);
        assert!(option::is_some(&salary), 3);
        assert!(is_active, 4);
        assert!(option::is_none(&hired), 5);
        assert!(deadline_check == deadline, 6);
        
        ts::return_shared(job);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = 1)]
    fun test_post_job_with_wrong_profile_fails() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        // @employer1 profil oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Company1"),
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
        
        // @employer2 başkasının profiliyle ilan vermeye çalışsın
        ts::next_tx(&mut scenario, @employer2);
        let mut job_board = ts::take_shared<JobBoard>(&scenario);
        let employer_profile = ts::take_shared<EmployerProfile>(&scenario);
        
        let deadline = clock::timestamp_ms(&clock) + 7 * 24 * 60 * 60 * 1000;
        
        minihub::post_job(
            &mut job_board,
            &employer_profile,
            test_helpers::utf8(b"Fake Job"),
            test_helpers::utf8(b"Description"),
            option::some(100000),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_job_board_tracking() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        // Bir işveren profili oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Company1"),
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
        
        // Aynı işveren 3 iş ilanı oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut job_board = ts::take_shared<JobBoard>(&scenario);
        let employer_profile = ts::take_shared<EmployerProfile>(&scenario);
        
        let deadline = clock::timestamp_ms(&clock) + 30 * 24 * 60 * 60 * 1000;
        
        minihub::post_job(
            &mut job_board,
            &employer_profile,
            test_helpers::utf8(b"Job 1"),
            test_helpers::utf8(b"Desc"),
            option::some(100000),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        minihub::post_job(
            &mut job_board,
            &employer_profile,
            test_helpers::utf8(b"Job 2"),
            test_helpers::utf8(b"Desc"),
            option::none(),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        minihub::post_job(
            &mut job_board,
            &employer_profile,
            test_helpers::utf8(b"Job 3"),
            test_helpers::utf8(b"Desc"),
            option::some(80000),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        assert!(minihub::get_total_jobs(&job_board) == 3, 0);
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_job_without_salary() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let clock = test_helpers::create_clock(&mut scenario);
        
        // İşveren profili oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Startup Company"),
            test_helpers::utf8(b"Innovative tech startup"),
            test_helpers::utf8(b"logo.png"),
            test_helpers::utf8(b"startup.com"),
            test_helpers::utf8(b"Technology"),
            5,
            2024,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(employer_registry);
        
        // Maaş belirtmeden iş ilanı oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut job_board = ts::take_shared<JobBoard>(&scenario);
        let employer_profile = ts::take_shared<EmployerProfile>(&scenario);
        
        let deadline = clock::timestamp_ms(&clock) + 14 * 24 * 60 * 60 * 1000; // 14 gün
        
        minihub::post_job(
            &mut job_board,
            &employer_profile,
            test_helpers::utf8(b"Junior Developer"),
            test_helpers::utf8(b"Entry level position"),
            option::none(), // Maaş yok
            deadline,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        
        // İş ilanını kontrol et
        ts::next_tx(&mut scenario, @employer1);
        let job = ts::take_shared<Job>(&scenario);
        
        let (_, _, title, _, salary, is_active, _, _) = minihub::get_job_info(&job);
        
        assert!(title == test_helpers::utf8(b"Junior Developer"), 0);
        assert!(option::is_none(&salary), 1); // Maaş yok
        assert!(is_active, 2);
        
        ts::return_shared(job);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_employer_can_post_multiple_jobs() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let clock = test_helpers::create_clock(&mut scenario);
        
        // İşveren profili oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Growing Startup"),
            test_helpers::utf8(b"Expanding team"),
            test_helpers::utf8(b"logo.png"),
            test_helpers::utf8(b"growing.com"),
            test_helpers::utf8(b"Tech"),
            15,
            2022,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(employer_registry);
        
        // Aynı işveren 5 farklı ilan açsın
        ts::next_tx(&mut scenario, @employer1);
        let mut job_board = ts::take_shared<JobBoard>(&scenario);
        let employer_profile = ts::take_shared<EmployerProfile>(&scenario);
        
        let deadline = clock::timestamp_ms(&clock) + 30 * 24 * 60 * 60 * 1000;
        let job_titles = vector[
            test_helpers::utf8(b"Frontend Developer"),
            test_helpers::utf8(b"Backend Developer"),
            test_helpers::utf8(b"DevOps Engineer"),
            test_helpers::utf8(b"Product Manager"),
            test_helpers::utf8(b"UX Designer")
        ];
        
        let mut i = 0;
        while (i < 5) {
            let title = *vector::borrow(&job_titles, i);
            
            minihub::post_job(
                &mut job_board,
                &employer_profile,
                title,
                test_helpers::utf8(b"Great opportunity"),
                option::some(100000 + (i * 10000)),
                deadline,
                ts::ctx(&mut scenario)
            );
            
            i = i + 1;
        };
        
        assert!(minihub::get_total_jobs(&job_board) == 5, 0);
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_high_salary_job() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let clock = test_helpers::create_clock(&mut scenario);
        
        // İşveren profili oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        minihub::create_employer_profile(
            &mut employer_registry,
            test_helpers::utf8(b"Big Tech Corp"),
            test_helpers::utf8(b"FAANG company"),
            test_helpers::utf8(b"logo.png"),
            test_helpers::utf8(b"bigtech.com"),
            test_helpers::utf8(b"Technology"),
            10000,
            1998,
            &clock,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(employer_registry);
        
        // Yüksek maaşlı ilan oluştur
        ts::next_tx(&mut scenario, @employer1);
        let mut job_board = ts::take_shared<JobBoard>(&scenario);
        let employer_profile = ts::take_shared<EmployerProfile>(&scenario);
        
        let deadline = clock::timestamp_ms(&clock) + 90 * 24 * 60 * 60 * 1000;
        let high_salary = 500000u64; // $500k
        
        minihub::post_job(
            &mut job_board,
            &employer_profile,
            test_helpers::utf8(b"Principal Engineer"),
            test_helpers::utf8(b"Lead our architecture team"),
            option::some(high_salary),
            deadline,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(job_board);
        ts::return_shared(employer_profile);
        
        // İlanı kontrol et
        ts::next_tx(&mut scenario, @admin);
        let job = ts::take_shared<Job>(&scenario);
        
        let (_, _, title, _, salary, _, _, _) = minihub::get_job_info(&job);
        
        assert!(title == test_helpers::utf8(b"Principal Engineer"), 0);
        assert!(option::is_some(&salary), 1);
        assert!(*option::borrow(&salary) == high_salary, 2);
        
        ts::return_shared(job);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    fun test_registry_counts() {
        let mut scenario = ts::begin(@admin);
        test_helpers::setup_test(&mut scenario);
        
        let mut clock = test_helpers::create_clock(&mut scenario);
        
        // 3 kullanıcı profili oluştur
        let candidates = vector[@candidate1, @candidate2, @candidate3];
        let mut i = 0;
        while (i < 3) {
            let candidate = *vector::borrow(&candidates, i);
            ts::next_tx(&mut scenario, candidate);
            let mut user_registry = ts::take_shared<UserRegistry>(&scenario);
            
            minihub::create_user_profile(
                &mut user_registry,
                test_helpers::utf8(b"User"),
                test_helpers::utf8(b"Bio"),
                test_helpers::utf8(b"avatar.jpg"),
                vector[test_helpers::utf8(b"Skill")],
                i,
                test_helpers::utf8(b"portfolio.com"),
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(user_registry);
            i = i + 1;
        };
        
        // 2 işveren profili oluştur
        let employers = vector[@employer1, @employer2];
        i = 0;
        while (i < 2) {
            let employer = *vector::borrow(&employers, i);
            ts::next_tx(&mut scenario, employer);
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
            i = i + 1;
        };
        
        // Sayıları kontrol et
        ts::next_tx(&mut scenario, @admin);
        let user_registry = ts::take_shared<UserRegistry>(&scenario);
        let employer_registry = ts::take_shared<EmployerRegistry>(&scenario);
        
        assert!(minihub::get_total_users(&user_registry) == 3, 0);
        assert!(minihub::get_total_employers(&employer_registry) == 2, 1);
        
        ts::return_shared(user_registry);
        ts::return_shared(employer_registry);
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
}
