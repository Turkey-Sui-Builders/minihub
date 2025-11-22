#[test_only]
module minihub::test_helpers {
    use minihub::minihub;
    use sui::test_scenario::{Scenario};
    use sui::clock::{Self, Clock};
    use std::string::{Self, String};
    
    // ====== Yardımcı Fonksiyonlar ======
    
    /// Test için clock objesi oluştur
    public fun create_clock(scenario: &mut Scenario): Clock {
        use sui::test_scenario as ts;
        ts::next_tx(scenario, @admin);
        let clock = clock::create_for_testing(ts::ctx(scenario));
        clock
    }
    
    /// String oluşturma yardımcısı
    public fun utf8(bytes: vector<u8>): String {
        string::utf8(bytes)
    }
    
    /// Test başlatma - JobBoard, UserRegistry, EmployerRegistry oluştur
    public fun setup_test(scenario: &mut Scenario) {
        use sui::test_scenario as ts;
        ts::next_tx(scenario, @admin);
        minihub::init_for_testing(ts::ctx(scenario));
    }
}
