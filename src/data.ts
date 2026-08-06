import { DraftPlayer, FilterResult } from './types';

// Pre-cached analysis for Kirk/Zac Robinson Falcons players or Rams players to give premium, instant experience
const DRAKE_LONDON_ANALYSIS: FilterResult = {
  playerName: 'Drake London',
  team: 'Atlanta Falcons',
  position: 'WR',
  objectiveMetrics: [
    'Earned a 22.4% target share in 2025 despite an uncatchable target rate of 18.2% (top 15 highest in NFL).',
    'Maintained a healthy 23.8% target rate per route run (TPRR) with an elite 58.3% contested catch rate.',
    'Restricted to just 8 red-zone targets due to the league\'s most run-heavy Arthur Smith offensive system.'
  ],
  narrativeTrashBin: 'Ignore training camp claims that he will instantly produce a 130-target season as a direct clone of Cooper Kupp or Puka Nacua.',
  trueRangeOfOutcomes: {
    floorDescription: 'If quarterback Kirk Cousins experiences post-injury physical regression or Atlanta remains balanced, London settles as a mid-tier WR2 on ~110 targets.',
    ceilingDescription: 'In an ultra-tempo McVay-style passing tree under Robinson, London secures a 26%+ target share, delivering low-end WR1 value with double-digit TDs.',
    floorValue: 11.2,
    ceilingValue: 17.4,
    metricType: 'PPG'
  },
  regressionFlags: [
    {
      metric: 'Uncatchable Target Rate of 18.2%',
      description: 'Mathematically guaranteed to regress significantly downward with Kirk Cousins under center (career completion rate of 66.9% vs. Falcons prior average of 59%).',
      severity: 'high'
    }
  ],
  systemAnalysis: {
    playCaller: 'Zac Robinson (OC)',
    tendency: 'Brings high-tempo, 11-personnel groupings (McVay tree). Drastically pivots away from the historical 51% neutral-script pass rate of the previous system.',
    impactScore: 88
  },
  varianceAssessment: 'London is a high-floor target earner whose efficiency ceiling was artificially suppressed. The system shift provides substantial premium upside.',
  clinicalScore: 8
};

const KYREN_WILLIAMS_ANALYSIS: FilterResult = {
  playerName: 'Kyren Williams',
  team: 'Los Angeles Rams',
  position: 'RB',
  objectiveMetrics: [
    'Commanded a monstrous 78.4% snap share when active, ranking 2nd among RBs.',
    'Averages an elite 18.2 Expected Fantasy Points per Game with a league-leading 4.8 red-zone touches per game.',
    'Exhibited mediocre individual efficiency: 2.11 Yards Created per Touch (36th) and a low 3.2% Breakaway Run Rate (41st).'
  ],
  narrativeTrashBin: 'Disregard coach claims that Kyren is an untouchable bell-cow and they will ride him until the wheels fall off.',
  trueRangeOfOutcomes: {
    floorDescription: 'Rookie Blake Corum takes over red-zone touches or high-leverage goal-line carries, reducing Williams to an efficient but volume-capped RB2.',
    ceilingDescription: 'Maintains his 70%+ snap share with elite volume in a top-10 offense, matching last season\'s high-end RB1 output.',
    floorValue: 12.1,
    ceilingValue: 19.8,
    metricType: 'PPG'
  },
  regressionFlags: [
    {
      metric: 'Touchdown rate of 15 TDs in 12 games',
      description: 'Extremely high red-zone touchdown conversion rate is highly vulnerable to regression, especially with a 3rd-round draft investment in Blake Corum.',
      severity: 'high'
    }
  ],
  systemAnalysis: {
    playCaller: 'Sean McVay (HC)',
    tendency: 'Historically prefers single-back systems with high run-blocking grades, but has actively rotated backs when durable options are drafted.',
    impactScore: 92
  },
  varianceAssessment: 'Williams features high-variance risk. While his role is elite under McVay, his low draft capital and Corum\'s addition present a wider-than-average floor.',
  clinicalScore: 6
};

const ANTHONY_RICHARDSON_ANALYSIS: FilterResult = {
  playerName: 'Anthony Richardson',
  team: 'Indianapolis Colts',
  position: 'QB',
  objectiveMetrics: [
    'Averaged a stellar 4 rushing touchdowns in just 4 partial rookie games.',
    'Registered a concerning 19.8% off-target throw rate, among the worst in the NFL.',
    'Delivered an underwhelming 61.2% completion rate from clean pockets, ranking 32nd.'
  ],
  narrativeTrashBin: 'Ignore hype calling him a safe Josh Allen clone whose rushing volume is completely insulated from injury protection protocols.',
  trueRangeOfOutcomes: {
    floorDescription: 'Off-target passing limits drive efficiency, shoulder injuries recur, and designed runs are dialed back, leaving him as a streaming-caliber option.',
    ceilingDescription: 'Shane Steichen maximizes QB power sweeps, Richardson completes 62% of passes with massive rushing volume, and finishes as the overall QB1.',
    floorValue: 14.2,
    ceilingValue: 24.5,
    metricType: 'PPG'
  },
  regressionFlags: [
    {
      metric: 'Rushing TD rate of 16.0%',
      description: 'Extremely unsustainable rushing touchdown rate over his 4-game sample. Rushing TDs will decrease even if volume remains stable.',
      severity: 'high'
    }
  ],
  systemAnalysis: {
    playCaller: 'Shane Steichen (HC)',
    tendency: 'Runs an extremely fast-paced offensive system (ranked 2nd in seconds per snap). Optimizes designed runs for dual-threat quarterbacks.',
    impactScore: 95
  },
  varianceAssessment: 'The ultimate high-ceiling, low-floor variance profile in fantasy football. Rushing upside is elite, but passing efficiency is highly volatile.',
  clinicalScore: 5
};

const KYLE_PITTS_ANALYSIS: FilterResult = {
  playerName: 'Kyle Pitts',
  team: 'Atlanta Falcons',
  position: 'TE',
  objectiveMetrics: [
    'Led all tight ends in average target distance (aDOT) at 11.2 yards and deep targets with 11.',
    'Suffered a terrible 62.4% catchable target rate, ranking 34th (bottom 5 among qualifying TEs).',
    'Averages a mediocre 1.41 yards per route run, showcasing structural limitations under the old system.'
  ],
  narrativeTrashBin: 'Pay no attention to the annual training camp reports that he is a "unicorn" lining up everywhere and causing matchup nightmares.',
  trueRangeOfOutcomes: {
    floorDescription: 'Does not fully earn high target volume alongside London and Bijan, settling as a touchdown-dependent, high-variance TE2.',
    ceilingDescription: 'Kirk Cousins fuels a career-best season, where Pitts operates as a high-end slot target, catching 80+ balls for 1,000+ yards and 8 TDs.',
    floorValue: 7.8,
    ceilingValue: 15.1,
    metricType: 'PPG'
  },
  regressionFlags: [
    {
      metric: 'Catchable Target Rate of 62.4%',
      description: 'Due for positive regression. Moving from bottom-tier quarterback play to Kirk Cousins is the largest single-season target accuracy upgrade a TE can receive.',
      severity: 'high'
    }
  ],
  systemAnalysis: {
    playCaller: 'Zac Robinson (OC)',
    tendency: 'Rams-style high 11-personnel system which frequently moves athletic tight ends into the slot to exploit coverage weaknesses.',
    impactScore: 85
  },
  varianceAssessment: 'High-ceiling variance tight end. While his talent remains highly rated, the arrival of Cousins establishes a secure statistical floor.',
  clinicalScore: 7
};

export const INITIAL_DRAFT_PLAYERS: DraftPlayer[] = [
  {
    id: '1',
    name: 'Christian McCaffrey',
    team: 'SF',
    position: 'RB',
    byeWeek: 9,
    adp: 3.1,
    projectedPointsStd: 298.5,
    projectedPointsPpr: 356.2,
    isBpa: true,
    isDrafted: false,
    rawMetrics: '2025 Stats: 272 carries, 1,459 rushing yards, 14 rushing TDs. 67 receptions, 564 receiving yards, 7 receiving TDs.\n- Target Share: 17.5%\n- Expected Fantasy Points per Game: 19.4\n- Yards Created per Touch: 3.22 (ranked 4th)\n- Red Zone Touches: 5.2 per game (1st in NFL)',
    coachingChanges: 'Kyle Shanahan remains HC and primary play-caller. 49ers offense ran 21-personnel at the league\'s highest rate. Highly efficient run-blocking grading (ranked 4th).',
    recentNews: '"McCaffrey is looking absolutely unstoppable in early practices." "Shanahan says McCaffrey will continue to have no volume restrictions despite his workload."'
  },
  {
    id: '2',
    name: 'CeeDee Lamb',
    team: 'DAL',
    position: 'WR',
    byeWeek: 7,
    adp: 4.2,
    projectedPointsStd: 232.4,
    projectedPointsPpr: 312.4,
    isDrafted: false,
    rawMetrics: '2025 Stats: 135 receptions, 1,749 yards, 12 TDs.\n- Target Share: 29.8% (ranked 2nd in NFL)\n- Target Rate per Route Run (TPRR): 31.2%\n- Yards Per Route Run (YPRR): 2.78 (ranked 3rd)\n- Red Zone Targets: 22 (ranked 1st in NFL)',
    coachingChanges: 'Mike McCarthy remains head coach and play-caller. Cowboys run a high neutral-script pass rate (61.5%) with heavy emphasis on isolated slot positioning for Lamb.',
    recentNews: '"CeeDee Lamb says he\'s ready for another 180-target season." "McCarthy emphasizes they will feed Lamb until he\'s full."'
  },
  {
    id: '3',
    name: 'Tyreek Hill',
    team: 'MIA',
    position: 'WR',
    byeWeek: 6,
    adp: 4.8,
    projectedPointsStd: 224.2,
    projectedPointsPpr: 298.7,
    isDrafted: false,
    rawMetrics: '2025 Stats: 119 receptions, 1,799 yards, 13 TDs.\n- Target Share: 32.2% (1st in NFL)\n- TPRR: 36.8% (1st in NFL)\n- YPRR: 3.82 (1st in NFL - historic outlier efficiency)\n- Catchable Target Rate: 78.4%',
    coachingChanges: 'Mike McDaniel HC and play-caller. Dolphins lead the league in motion-rate before the snap (82%), gaining free releases for Hill against press coverage.',
    recentNews: '"Tyreek Hill is aiming for a 2,000-yard season." "McDaniel states they will find creative ways to get Hill 12+ touches a game."'
  },
  {
    id: '4',
    name: 'Ja\'Marr Chase',
    team: 'CIN',
    position: 'WR',
    byeWeek: 7,
    adp: 4.8,
    projectedPointsStd: 212.5,
    projectedPointsPpr: 289.3,
    isDrafted: false,
    rawMetrics: '2025 Stats: 100 receptions, 1,216 yards, 7 TDs (impacted by Joe Burrow injury).\n- Target Share: 26.5%\n- TPRR: 26.2%\n- YPRR: 1.98\n- Deep Targets: 18 (ranked 5th in NFL)',
    coachingChanges: 'Dan Pitcher takes over as OC but Zac Taylor remains head coach and primary play-caller. Bengals operate in high-tempo 11-personnel spreads.',
    recentNews: '"Chase says a fully healthy Joe Burrow means the league is in trouble." "Bengals beat writer reports Chase is lining up more in the slot to create matchups."'
  },
  {
    id: '5',
    name: 'Saquon Barkley',
    team: 'PHI',
    position: 'RB',
    byeWeek: 5,
    adp: 6.2,
    projectedPointsStd: 218.4,
    projectedPointsPpr: 278.1,
    isDrafted: false,
    rawMetrics: '2025 Stats (with NYG): 247 carries, 962 rushing yards, 6 TDs. 41 receptions, 280 yards, 4 TDs.\n- Expected Fantasy Points per Game: 15.6\n- Yards Created per Touch: 2.22 (ranked 31st)\n- Run-blocking grade of previous Giants line: 31st',
    coachingChanges: 'Barkley moves to Philadelphia. Kellen Moore takes over as OC. Eagles offensive line run-blocking graded 2nd in NFL. However, Jalen Hurts\' "Tush Push" threatens goal-line rushing TD ceiling.',
    recentNews: '"Barkley looks electric in Eagles green." "Hurts says having Saquon in the backfield takes all the pressure off." "Moore says Saquon will be a major weapon in the screen game."'
  },
  {
    id: '6',
    name: 'Justin Jefferson',
    team: 'MIN',
    position: 'WR',
    byeWeek: 6,
    adp: 5.1,
    projectedPointsStd: 205.1,
    projectedPointsPpr: 281.2,
    isDrafted: false,
    rawMetrics: '2025 Stats (10 games): 68 receptions, 1,074 yards, 5 TDs.\n- Target Share: 28.1%\n- TPRR: 28.4%\n- YPRR: 2.91 (ranked 2nd in NFL)\n- Catchable Target Rate: 72.5%',
    coachingChanges: 'Kevin O\'Connell HC and play-caller. Vikings run an pass-heavy, high-neutral-pass-rate scheme (62.1%). Quarterback shift from Kirk Cousins to Sam Darnold/J.J. McCarthy.',
    recentNews: '"Jefferson says he doesn\'t care who is throwing him the ball, he\'ll get open." "O\'Connell plans to move Jefferson around the formation to shield him from double teams."'
  },
  {
    id: '7',
    name: 'Amon-Ra St. Brown',
    team: 'DET',
    position: 'WR',
    byeWeek: 5,
    adp: 7.4,
    projectedPointsStd: 195.4,
    projectedPointsPpr: 267.4,
    isDrafted: false,
    rawMetrics: '2025 Stats: 119 receptions, 1,515 yards, 10 TDs.\n- Target Share: 29.2% (ranked 3rd in NFL)\n- TPRR: 29.8%\n- YPRR: 2.59 (ranked 6th in NFL)\n- Slot Rate: 54.2%',
    coachingChanges: 'Ben Johnson remains OC. Lions are highly efficient, running a fast, balanced indoor dome offense with high-neutral pace.',
    recentNews: '"St. Brown is working on his deep threat capability this summer." "Ben Johnson claims St. Brown is the absolute heartbeat of this offensive squad."'
  },
  {
    id: '8',
    name: 'Puka Nacua',
    team: 'LAR',
    position: 'WR',
    byeWeek: 6,
    adp: 9.1,
    projectedPointsStd: 189.6,
    projectedPointsPpr: 258.6,
    isDrafted: false,
    rawMetrics: '2025 Stats: 105 receptions, 1,486 yards, 6 TDs (NFL Rookie Record).\n- Target Share: 28.7%\n- TPRR: 28.9%\n- YPRR: 2.72 (ranked 4th in NFL)\n- Yards after Catch: 612 yards (ranked 3rd)',
    coachingChanges: 'Sean McVay remains HC/play-caller. Rams ran 11-personnel at 92.1% rate. Highly condensed target tree centered on Nacua and Cooper Kupp.',
    recentNews: '"Nacua says he is lighter, faster, and knows the playbook inside and out." "McVay says Puka\'s blocking is what makes him a unicorn but they will get him more vertical targets."'
  },
  {
    id: '9',
    name: 'Bijan Robinson',
    team: 'ATL',
    position: 'RB',
    byeWeek: 11,
    adp: 1.1,
    projectedPointsStd: 302.4,
    projectedPointsPpr: 361.4,
    isDrafted: false,
    rawMetrics: '2025 Stats: 214 carries, 976 yards, 4 TDs; 58 receptions, 487 yards, 4 receiving TDs.\n- Snap Share: 52.1% (severely capped under previous staff)\n- Expected Fantasy Points per Game: 12.8\n- Yards Created per Touch: 2.94 (ranked 8th)\n- 2026 Outlook: Undisputed legendary overall RB1 favorite on all major fantasy boards.',
    coachingChanges: 'Zac Robinson (Rams) takes over as OC. Moving away from Arthur Smith\'s rotational system. Robinson expected to feed Bijan an absolute Christian McCaffrey-type 3-down workload.',
    recentNews: '"Bijan Robinson says OC Zac Robinson wants to use him all over the field." "Falcons coaching staff says Bijan is an absolute gold-mine asset who will see a massive volume expansion."',
    preCachedAnalysis: {
      playerName: 'Bijan Robinson',
      team: 'Atlanta Falcons',
      position: 'RB',
      objectiveMetrics: [
        'Maintained elite individual efficiency: 2.94 Yards Created per Touch (ranked 8th in NFL) despite substandard line play.',
        'Stifled by an artificial 52.1% snap share cap under previous Arthur Smith staff.',
        'Earned a robust 58 receptions as a rookie, displaying clear high-floor receiving upside.'
      ],
      narrativeTrashBin: 'Disregard camp stories that Bijan will easily hit 400 total touches and finish as a direct carbon copy of peak Christian McCaffrey.',
      trueRangeOfOutcomes: {
        floorDescription: 'Tyler Allgeier retains a annoying 35% rotational share of early-down carries, limiting Robinson to a high-end RB1 but not the overall league-winner.',
        ceilingDescription: 'Zac Robinson deploys him in a complete 75% snap bell-cow capacity, yielding 280 carries and 80 targets for a massive 20+ PPG overall RB1 run.',
        floorValue: 13.5,
        ceilingValue: 22.8,
        metricType: 'PPG'
      },
      regressionFlags: [
        {
          metric: 'Snap Share of 52.1%',
          description: 'Due for positive regression. New coaching staff and premium draft capital guarantee a significant snap percentage expansion toward 70%+',
          severity: 'high'
        }
      ],
      systemAnalysis: {
        playCaller: 'Zac Robinson (OC)',
        tendency: 'Brings Rams-style system prioritizing single-back volume and matching dual-threat backs in open spaces to exploit linebackers.',
        impactScore: 90
      },
      varianceAssessment: 'Extremely high-ceiling asset. The floor is exceptionally safe due to elite natural talent and high pass-catching capabilities in an upgraded offense.',
      clinicalScore: 9
    }
  },
  {
    id: '10',
    name: 'Drake London',
    team: 'ATL',
    position: 'WR',
    byeWeek: 12,
    adp: 18.2,
    projectedPointsStd: 145.2,
    projectedPointsPpr: 214.2,
    isDrafted: false,
    rawMetrics: '2025 Stats: 110 targets, 69 receptions, 905 yards, 2 TDs. \n- Target Share: 22.4%\n- TPRR: 23.8%\n- YPRR: 1.84\n- Uncatchable Target Rate: 18.2% (top 15 highest in NFL)\n- Contested Catch Rate: 58.3%',
    coachingChanges: 'Offensive Coordinator change: Zac Robinson takes over as OC. Bringing the Sean McVay 11-personnel, high-tempo, high-neutral-script-pass-rate offensive system.',
    recentNews: '"Drake London is looking like a absolute superstar in training camp." "OC Robinson says London will play the Cooper Kupp/Puka Nacua role."',
    preCachedAnalysis: DRAKE_LONDON_ANALYSIS
  },
  {
    id: '11',
    name: 'Kyren Williams',
    team: 'LAR',
    position: 'RB',
    byeWeek: 6,
    adp: 15.4,
    projectedPointsStd: 198.4,
    projectedPointsPpr: 238.4,
    isDrafted: false,
    rawMetrics: '2025 Stats: 228 carries, 1,144 yards, 12 rushing TDs; 32 receptions, 206 yards, 3 receiving TDs. \n- Snap Share: 78.4%\n- Expected Fantasy Points per Game: 18.2\n- Red Zone Touches: 4.8 per game\n- Yards Created per Touch: 2.11',
    coachingChanges: 'Head Coach Sean McVay remains primary play-caller. Rams drafted running back Blake Corum in the 3rd round, indicating a potential committee approach.',
    recentNews: '"Sean McVay states Kyren Williams is our bell-cow." "Rams beat reporter reports that Kyren has put on 5 lbs of lean muscle."',
    preCachedAnalysis: KYREN_WILLIAMS_ANALYSIS
  },
  {
    id: '12',
    name: 'Anthony Richardson',
    team: 'IND',
    position: 'QB',
    byeWeek: 14,
    adp: 45.2,
    projectedPointsStd: 310.4,
    projectedPointsPpr: 310.4,
    isDrafted: false,
    rawMetrics: '2025 Stats (4 games): Passing: 50/84, 577 yards, 3 TDs, 1 INT. Rushing: 25 carries, 136 yards, 4 TDs.\n- Rushing yards per game: 34.0\n- Rushing TD rate: 16.0%\n- Off-Target Throw Rate: 19.8%',
    coachingChanges: 'Head Coach Shane Steichen remains play-caller. Historically, Steichen runs a fast-paced offense (Colts ranked 2nd in seconds per snap).',
    recentNews: '"Richardson is primed for a nuclear season." "Local reports claim Richardson\'s arm is stronger than ever post-surgery."',
    preCachedAnalysis: ANTHONY_RICHARDSON_ANALYSIS
  },
  {
    id: '13',
    name: 'Kyle Pitts',
    team: 'ATL',
    position: 'TE',
    byeWeek: 12,
    adp: 58.4,
    projectedPointsStd: 112.4,
    projectedPointsPpr: 165.4,
    isDrafted: false,
    rawMetrics: '2025 Stats: 90 targets, 53 receptions, 667 yards, 3 TDs. \n- Route Participation: 72.3%\n- Target Share: 17.6%\n- Deep Targets: 11\n- Average Target Distance (aDOT): 11.2 yards\n- Catchable Target Rate: 62.4%',
    coachingChanges: 'Atlanta swaps run-heavy Arthur Smith for Zac Robinson (Rams tree). Robinson\'s Rams historically featured tight ends running high routes in empty formations.',
    recentNews: '"Kyle Pitts is finally 100% healthy after knee surgery." "Coaching staff says Pitts is a unicorn who will line up in slot, wide, and in-line."',
    preCachedAnalysis: KYLE_PITTS_ANALYSIS
  },
  {
    id: '14',
    name: 'Breece Hall',
    team: 'NYJ',
    position: 'RB',
    byeWeek: 12,
    adp: 3.5,
    projectedPointsStd: 210.4,
    projectedPointsPpr: 265.4,
    isDrafted: false,
    rawMetrics: '2025 Stats: 223 carries, 994 yards, 5 TDs. 76 receptions, 591 yards, 4 TDs.\n- Target Share: 14.8% (1st among RBs)\n- Expected Fantasy Points per Game: 16.8\n- Yards Created per Touch: 2.82 (ranked 10th)\n- 18 months post-ACL tear',
    coachingChanges: 'Nathaniel Hackett remains OC. Aaron Rodgers returns as starting QB, which increases red zone opportunities but may reduce the high dump-off volume Hall received with Zach Wilson.',
    recentNews: '"Hall says he is finally feeling 100% of his pre-injury speed." "Jets coaches claim Hall is the engine of the offense alongside Wilson."'
  },
  {
    id: '15',
    name: 'Garrett Wilson',
    team: 'NYJ',
    position: 'WR',
    byeWeek: 12,
    adp: 13.5,
    projectedPointsStd: 164.2,
    projectedPointsPpr: 232.2,
    isDrafted: false,
    rawMetrics: '2025 Stats: 95 receptions, 1,042 yards, 3 TDs (under highly uncatchable QB play).\n- Target Share: 29.5% (ranked 3rd)\n- TPRR: 28.1%\n- Uncatchable Target Rate: 24.2% (highest among top-30 WRs)\n- YPRR: 1.56',
    coachingChanges: 'Aaron Rodgers returns. Historically, Rodgers locks onto his primary X receiver (e.g., Davante Adams) in high-leverage and red-zone situations.',
    recentNews: '"Wilson and Rodgers show perfect chemistry in camp." "Wilson is expected to double his touchdown output with stable quarterback play."'
  },
  {
    id: '16',
    name: 'Travis Kelce',
    team: 'KC',
    position: 'TE',
    byeWeek: 6,
    adp: 28.4,
    projectedPointsStd: 132.4,
    projectedPointsPpr: 188.4,
    isDrafted: false,
    rawMetrics: '2025 Stats: 93 receptions, 984 yards, 5 TDs (missed 2 games).\n- Target Share: 22.4%\n- Route Participation: 78.2%\n- TPRR: 24.1%\n- YPRR: 1.92 (lowest since 2016)',
    coachingChanges: 'Andy Reid remains HC/play-caller. Chiefs added speedsters Hollywood Brown and Xavier Worthy to stretch defenses, which could open up intermediate spaces for Kelce.',
    recentNews: '"Kelce states he is fresh, healthy, and has no plans to slow down." "Mahomes says Kelce remains the absolute safety valve in critical third downs."'
  },
  {
    id: '17',
    name: 'Sam LaPorta',
    team: 'DET',
    position: 'TE',
    byeWeek: 5,
    adp: 26.2,
    projectedPointsStd: 141.2,
    projectedPointsPpr: 198.2,
    isDrafted: false,
    rawMetrics: '2025 Stats: 86 receptions, 889 yards, 10 TDs (Historic Rookie Season).\n- Target Share: 19.8%\n- Route Participation: 79.4%\n- Red Zone Targets: 15 (ranked 2nd among TEs)\n- Touchdown Rate per Reception: 11.6% (unsustainably high)',
    coachingChanges: 'Ben Johnson remains OC. Tight ends in Johnson\'s system run high routes in the red zone and operate as primary seam-stretchers.',
    recentNews: '"LaPorta says he\'s just scratching the surface of his capabilities." "Coaches claim LaPorta\'s run blocking is so good he will rarely leave the field."'
  },
  {
    id: '18',
    name: 'Josh Allen',
    team: 'BUF',
    position: 'QB',
    byeWeek: 12,
    adp: 31.4,
    projectedPointsStd: 388.4,
    projectedPointsPpr: 388.4,
    isDrafted: false,
    rawMetrics: '2025 Stats: 4,306 passing yards, 29 passing TDs, 18 INTs. 111 carries, 524 rushing yards, 15 rushing TDs.\n- Rushing TD rate per carry: 13.5% (unsustainably high rushing TD rate)\n- Offense neutral script run-rate increased under Joe Brady (48% vs previous 41%)',
    coachingChanges: 'Joe Brady stays as full-time OC. Under Brady, Bills pivoted toward a ground-heavy, run-first attack with less vertical shot attempts. Stefon Diggs traded.',
    recentNews: '"Allen says he will do whatever it takes to win, including running at the goal line." "Brady says they will spread the ball around and not rely on one single target."'
  },
  {
    id: '19',
    name: 'Jalen Hurts',
    team: 'PHI',
    position: 'QB',
    byeWeek: 5,
    adp: 34.2,
    projectedPointsStd: 362.4,
    projectedPointsPpr: 362.4,
    isDrafted: false,
    rawMetrics: '2025 Stats: 3,858 passing yards, 23 passing TDs, 15 INTs. 157 carries, 605 rushing yards, 15 rushing TDs.\n- Rushing TD Rate: 9.5%\n- Tush Push attempts: 42 (converting 34 of them)\n- Clean Pocket Completion %: 68.4%',
    coachingChanges: 'Kellen Moore takes over as OC. Moore traditionally runs a high-tempo, pass-heavy spread scheme, which could increase passing volume but reduce some designed QB run sweeps.',
    recentNews: '"Hurts says his shoulder is completely healed." "Sirianni says the Tush Push remains a core part of their short yardage identity."'
  },
  {
    id: '20',
    name: 'Patrick Mahomes',
    team: 'KC',
    position: 'QB',
    byeWeek: 6,
    adp: 38.4,
    projectedPointsStd: 335.2,
    projectedPointsPpr: 335.2,
    isDrafted: false,
    rawMetrics: '2025 Stats: 4,183 passing yards, 27 passing TDs, 14 INTs. \n- Yards Per Attempt: 7.0 (career low)\n- Deep Throw Rate: 8.2% (lowest in NFL, heavily impacted by dropped passes)\n- Clean Pocket Completion %: 71.4%',
    coachingChanges: 'Andy Reid remains HC/play-caller. Chiefs signed deep threats Marquise Brown and rookie speedster Xavier Worthy to restore their downfield passing capacity.',
    recentNews: '"Mahomes says they are bringing the deep shot back this season." "Reid says having speed on the outside opens up the entire offensive strategy."'
  },
  {
    id: '21',
    name: 'Lamar Jackson',
    team: 'BAL',
    position: 'QB',
    byeWeek: 14,
    adp: 36.8,
    projectedPointsStd: 348.6,
    projectedPointsPpr: 348.6,
    isDrafted: false,
    rawMetrics: '2025 Stats: 3,678 passing yards, 24 passing TDs, 7 INTs. 148 carries, 821 rushing yards, 5 rushing TDs.\n- Rushing yards per game: 51.3\n- Yards Created per Carry: 4.12\n- Deep Throw Rate: 12.4%',
    coachingChanges: 'Todd Monken remains OC. Ravens added elite bruising running back Derrick Henry, which could reduce Lamar\'s inside zone rushing volume and goal-line attempts.',
    recentNews: '"Lamar has slimmed down to 205 lbs to regain extreme vertical agility." "Monken says Henry\'s presence will create lethal play-action options for Lamar."'
  },
  {
    id: '22',
    name: 'Jonathan Taylor',
    team: 'IND',
    position: 'RB',
    byeWeek: 14,
    adp: 12.1,
    projectedPointsStd: 192.4,
    projectedPointsPpr: 228.4,
    isDrafted: false,
    rawMetrics: '2025 Stats (10 games): 169 carries, 741 yards, 7 TDs. 19 receptions, 153 yards, 1 TD.\n- Snap Share: 61.2%\n- Expected Fantasy Points per Game: 14.2\n- Yards Created per Touch: 2.34',
    coachingChanges: 'Shane Steichen remains HC. Dual-threat Anthony Richardson returns at QB. Richardson\'s elite rushing ability may reduce Taylor\'s red-zone rushing attempts.',
    recentNews: '"Taylor says he and Richardson in the backfield is a cheat code." "Steichen says Taylor remains a premier 3-down workload engine."'
  },
  {
    id: '23',
    name: 'Jahmyr Gibbs',
    team: 'DET',
    position: 'RB',
    byeWeek: 5,
    adp: 1.2,
    projectedPointsStd: 292.4,
    projectedPointsPpr: 346.4,
    isDrafted: false,
    rawMetrics: '2025 Stats: 182 carries, 945 yards, 10 TDs; 52 receptions, 316 yards, 1 TD.\n- Snap Share: 75%+ (Undisputed Bell-Cow after David Montgomery\'s departure to the Texans)\n- Yards Created per Touch: 3.12 (ranked 6th)\n- Breakaway Run Rate (15+ yards): 6.8% (ranked 3rd)',
    coachingChanges: 'Ben Johnson remains OC. With David Montgomery traded/signed to the Houston Texans in 2026, Ben Johnson is installing Gibbs as the full-fledged, undisputed bell-cow. Expect massive early-down, goal-line, and vertical receiving usage.',
    recentNews: '"Gibbs says his goal is 1,500 yards rushing and 800 yards receiving." "Johnson claims Gibbs is now our centerpiece three-down weapon."'
  },
  {
    id: '24',
    name: 'Marvin Harrison Jr.',
    team: 'ARI',
    position: 'WR',
    byeWeek: 11,
    adp: 16.5,
    projectedPointsStd: 154.5,
    projectedPointsPpr: 222.5,
    isDrafted: false,
    rawMetrics: 'Rookie Draft Capital: 4th overall pick. Elite college production at Ohio State.\n- Projected Target Share: 26.5%\n- Historical target share for WR1s under Drew Petzing: 24.8%',
    coachingChanges: 'Drew Petzing remains OC. Cardinals run an efficient, play-action heavy system under Kyler Murray, which focuses heavily on feeding the primary outside receiver.',
    recentNews: '"Harrison Jr. is already looking like the best player on the field." "Murray says Marvin is incredibly mature and runs routes like a 5-year veteran."'
  },
  {
    id: '25',
    name: 'A.J. Brown',
    team: 'PHI',
    position: 'WR',
    byeWeek: 5,
    adp: 10.8,
    projectedPointsStd: 184.2,
    projectedPointsPpr: 254.2,
    isDrafted: false,
    rawMetrics: '2025 Stats: 106 receptions, 1,456 yards, 7 TDs.\n- Target Share: 28.1% (ranked 5th)\n- TPRR: 27.8%\n- YPRR: 2.52 (ranked 8th)\n- Deep Targets: 22 (ranked 3rd)',
    coachingChanges: 'Kellen Moore takes over as OC. Moore\'s offensive style typically uses pre-snap motion to get WR1s in clean space, avoiding boundary double-teams.',
    recentNews: '"A.J. Brown says he\'s thrilled about Kellen Moore\'s motion schemes." "Hurts says Brown\'s ability on slant routes is completely unguardable."'
  },

  // ADDING EXCELLENT DEPTH OF QBs (20+ total)
  {
    id: '101', name: 'C.J. Stroud', team: 'HOU', position: 'QB', byeWeek: 14, adp: 48.5, projectedPointsStd: 298.4, projectedPointsPpr: 298.4, isDrafted: false,
    rawMetrics: '4,108 Passing Yards, 23 TDs, 5 INTs. Underwhelming 167 rushing yards, 3 TDs.',
    coachingChanges: 'Bobby Slowik remains OC. High pass volume, wide offensive spacing.',
    recentNews: 'Hype claims Stefon Diggs addition yields easy overall top 3 QB finish.'
  },
  {
    id: '102', name: 'Dak Prescott', team: 'DAL', position: 'QB', byeWeek: 7, adp: 62.4, projectedPointsStd: 292.1, projectedPointsPpr: 292.1, isDrafted: false,
    rawMetrics: '4,516 Passing Yards, 36 Passing TDs (NFL leader), 9 INTs.',
    coachingChanges: 'Mike McCarthy calling plays, pass-heavy neutral scripts.',
    recentNews: 'Contract negotiations have no negative effect on summer focus.'
  },
  {
    id: '103', name: 'Kyler Murray', team: 'ARI', position: 'QB', byeWeek: 11, adp: 68.2, projectedPointsStd: 285.5, projectedPointsPpr: 285.5, isDrafted: false,
    rawMetrics: 'Averaged 41.2 rushing yards per game upon returning from injury.',
    coachingChanges: 'Drew Petzing maximizes play-action and dual-threat design.',
    recentNews: 'Cardinals beat writer reports fully healthy leg makes Kyler top-5 target.'
  },
  {
    id: '104', name: 'Jordan Love', team: 'GB', position: 'QB', byeWeek: 10, adp: 74.1, projectedPointsStd: 280.4, projectedPointsPpr: 280.4, isDrafted: false,
    rawMetrics: '4,159 Passing Yards, 32 TDs, 11 INTs. Strong second-half of season.',
    coachingChanges: 'Matt LaFleur is highly efficient with spread play calling.',
    recentNews: 'Teammates claim Jordan has assumed total control of the team locker room.'
  },
  {
    id: '105', name: 'Joe Burrow', team: 'CIN', position: 'QB', byeWeek: 12, adp: 55.6, projectedPointsStd: 288.5, projectedPointsPpr: 288.5, isDrafted: false,
    rawMetrics: 'Incomplete stats in 2025 due to wrist tendon tear.',
    coachingChanges: 'Taylor stays calling plays, high shotgun and 11-personnel spreads.',
    recentNews: 'Wrist recovery reports are completely green light.'
  },
  {
    id: '106', name: 'Brock Purdy', team: 'SF', position: 'QB', byeWeek: 9, adp: 88.5, projectedPointsStd: 275.2, projectedPointsPpr: 275.2, isDrafted: false,
    rawMetrics: '4,280 Passing Yards, 31 TDs, 11 INTs. Historic 9.6 yards per attempt.',
    coachingChanges: 'Kyle Shanahan remains elite play-caller. High efficiency setup.',
    recentNews: 'Claims that he is just a system manager are heavily dismissed.'
  },
  {
    id: '107', name: 'Jared Goff', team: 'DET', position: 'QB', byeWeek: 5, adp: 102.4, projectedPointsStd: 268.4, projectedPointsPpr: 268.4, isDrafted: false,
    rawMetrics: '4,575 Passing Yards, 30 TDs, 12 INTs. Top performance in indoor domes.',
    coachingChanges: 'Ben Johnson system is highly friendly to intermediate throws.',
    recentNews: 'Lions locking Jared up to extension signals absolute confidence.'
  },
  {
    id: '108', name: 'Caleb Williams', team: 'CHI', position: 'QB', byeWeek: 7, adp: 95.1, projectedPointsStd: 258.4, projectedPointsPpr: 258.4, isDrafted: false,
    rawMetrics: '1st Overall Pick. Stellar athletic resume at USC.',
    coachingChanges: 'Shane Waldron takes over as Chicago OC.',
    recentNews: 'Camp reports praise raw vertical off-platform throw capability.'
  },
  {
    id: '109', name: 'Jayden Daniels', team: 'WAS', position: 'QB', byeWeek: 14, adp: 104.5, projectedPointsStd: 262.1, projectedPointsPpr: 262.1, isDrafted: false,
    rawMetrics: 'Heisman Trophy winner with historic college rushing efficiency.',
    coachingChanges: 'Kliff Kingsbury OC runs up-tempo spread system.',
    recentNews: 'Beat reporters claim his designed run usage could match Lamar Jackson.'
  },
  {
    id: '110', name: 'Tua Tagovailoa', team: 'MIA', position: 'QB', byeWeek: 6, adp: 110.2, projectedPointsStd: 252.4, projectedPointsPpr: 252.4, isDrafted: false,
    rawMetrics: '4,624 Passing Yards (1st in NFL), 29 TDs, 14 INTs. Low rushing floor.',
    coachingChanges: 'McDaniel OC setup stretches field vertically.',
    recentNews: 'Hype claims bulked up build shields him from impact regression.'
  },

  // ADDING EXCELLENT DEPTH OF RBs (35+ total)
  {
    id: '152', name: 'Travis Etienne Jr.', team: 'JAX', position: 'RB', byeWeek: 12, adp: 21.2, projectedPointsStd: 188.5, projectedPointsPpr: 232.4, isDrafted: false,
    rawMetrics: '267 Carries, 1,008 Rushing Yards, 11 TDs. 58 Receptions.',
    coachingChanges: 'Press Taylor OC. Needs interior line improvement.',
    recentNews: 'Coaches claim they want to trim workload to keep him explosive.'
  },
  {
    id: '153', name: 'De\'Von Achane', team: 'MIA', position: 'RB', byeWeek: 6, adp: 24.5, projectedPointsStd: 192.4, projectedPointsPpr: 228.1, isDrafted: false,
    rawMetrics: 'Historic 7.8 Yards Per Carry average. 11 TDs in only 11 active games.',
    coachingChanges: 'McDaniel utilizes speed-based zone runs and split backfields.',
    recentNews: 'Achane gained 10 lbs of muscle to support interior running durability.'
  },
  {
    id: '154', name: 'Derrick Henry', team: 'BAL', position: 'RB', byeWeek: 14, adp: 28.1, projectedPointsStd: 198.5, projectedPointsPpr: 215.4, isDrafted: false,
    rawMetrics: '280 Carries, 1,167 Yards, 12 TDs with Giants/Titans.',
    coachingChanges: 'Todd Monken OC. Moves to Baltimore heavy run blocks.',
    recentNews: 'Praise claims Henry will see 15+ rushing touchdowns behind Ravens line.'
  },
  {
    id: '155', name: 'Isiah Pacheco', team: 'KC', position: 'RB', byeWeek: 6, adp: 32.4, projectedPointsStd: 175.4, projectedPointsPpr: 210.2, isDrafted: false,
    rawMetrics: '205 Carries, 935 Yards, 7 TDs. Expanded passing role late.',
    coachingChanges: 'Andy Reid prefers 3-down back in high-leverage games.',
    recentNews: 'Reid says Pacheco runs with absolute fury and matches our system.'
  },
  {
    id: '156', name: 'Rachaad White', team: 'TB', position: 'RB', byeWeek: 11, adp: 35.8, projectedPointsStd: 162.1, projectedPointsPpr: 218.4, isDrafted: false,
    rawMetrics: '272 Carries, 990 Yards, 6 TDs. 64 Receptions, 549 receiving yards.',
    coachingChanges: 'Liam Coen takes over OC. Expected to introduce mid-zone runs.',
    recentNews: 'Coaches want to draft backup, raising volume regression concerns.'
  },
  {
    id: '157', name: 'James Cook', team: 'BUF', position: 'RB', byeWeek: 12, adp: 40.2, projectedPointsStd: 168.4, projectedPointsPpr: 212.1, isDrafted: false,
    rawMetrics: '237 Carries, 1,122 Yards, 2 TDs. 44 Receptions, 4 TDs.',
    coachingChanges: 'Joe Brady stays OC. Run-focused offense, but limited inside TDs.',
    recentNews: 'Brady claims James Cook is a perfect fit for open field matchups.'
  },
  {
    id: '158', name: 'Joe Mixon', team: 'HOU', position: 'RB', byeWeek: 14, adp: 45.1, projectedPointsStd: 172.5, projectedPointsPpr: 208.4, isDrafted: false,
    rawMetrics: '257 Carries, 1,034 Yards, 9 TDs with Bengals.',
    coachingChanges: 'Moves to Houston. Bobby Slowik rewards reliable volume.',
    recentNews: 'Mixon named immediate starter with primary goal-line duties.'
  },
  {
    id: '159', name: 'Alvin Kamara', team: 'NO', position: 'RB', byeWeek: 12, adp: 48.2, projectedPointsStd: 142.1, projectedPointsPpr: 205.4, isDrafted: false,
    rawMetrics: '75 Receptions in just 13 active games, insulating his PPR floor.',
    coachingChanges: 'Klint Kubiak OC. Moving to high motion and outside-zone checkdowns.',
    recentNews: 'Reports state Kamara is extremely fit and ready for heavy target volume.'
  },
  {
    id: '160', name: 'Kenneth Walker III', team: 'SEA', position: 'RB', byeWeek: 10, adp: 52.4, projectedPointsStd: 168.4, projectedPointsPpr: 195.1, isDrafted: false,
    rawMetrics: '219 Carries, 905 Yards, 8 TDs. Volatile target share.',
    coachingChanges: 'Ryan Grubb takes over as Seattle OC with spread-offense style.',
    recentNews: 'Grubb says Walker has exceptional speed and three-down capability.'
  },
  {
    id: '161', name: 'Josh Jacobs', team: 'GB', position: 'RB', byeWeek: 10, adp: 38.5, projectedPointsStd: 170.2, projectedPointsPpr: 208.5, isDrafted: false,
    rawMetrics: '233 Carries, 805 Yards, 6 TDs in a down year with Raiders.',
    coachingChanges: 'Jacobs moves to Green Bay under Matt LaFleur\'s zone run system.',
    recentNews: 'Packers coaches state Jacobs is an ideal bell-cow to take pressure off Love.'
  },
  {
    id: '162', name: 'D\'Andre Swift', team: 'CHI', position: 'RB', byeWeek: 7, adp: 64.2, projectedPointsStd: 145.4, projectedPointsPpr: 188.2, isDrafted: false,
    rawMetrics: '229 Carries, 1,049 Yards, 5 TDs behind Eagles elite line.',
    coachingChanges: 'Swift moves to Chicago. Shane Waldron OC prefers a rotational back.',
    recentNews: 'Waldron intends to use Swift heavily as a checkdown receiver.'
  },
  {
    id: '163', name: 'David Montgomery', team: 'HOU', position: 'RB', byeWeek: 5, adp: 62.5, projectedPointsStd: 164.5, projectedPointsPpr: 184.2, isDrafted: false,
    rawMetrics: '2026 Status: Moved to the Houston Texans.\n- Carries: Projected for major share alongside Joe Mixon.\n- Red Zone specialist for the potent Houston aerial threat.',
    coachingChanges: 'Bobby Slowik takes over his management. Moves to the Texans\' versatile ground scheme, adding high-value touchdown upside.',
    recentNews: '"Montgomery is officially a Houston Texan for the 2026 campaign." "Slowik plans to feature Monty in heavy goal-line packages to preserve Stroud."'
  },
  {
    id: '164', name: 'James Conner', team: 'ARI', position: 'RB', byeWeek: 11, adp: 72.4, projectedPointsStd: 158.4, projectedPointsPpr: 185.1, isDrafted: false,
    rawMetrics: '208 Carries, 1,012 Yards, 7 TDs. High individual efficiency.',
    coachingChanges: 'Petzing OC. High reliance on Conner as run blocker and grinder.',
    recentNews: 'Arizona drafted Trey Benson in 3rd round, adding workload risk.'
  },
  {
    id: '165', name: 'Zamir White', team: 'LV', position: 'RB', byeWeek: 6, adp: 78.5, projectedPointsStd: 148.4, projectedPointsPpr: 168.2, isDrafted: false,
    rawMetrics: 'Averaged 21.2 touches and 100+ yards over final 4 starts without Jacobs.',
    coachingChanges: 'Luke Getsy takes over OC. Run-heavy historical tendencies.',
    recentNews: 'Getsy claims Zamir is built for heavy volume and inside grinding.'
  },

  // ADDING EXCELLENT DEPTH OF WRs (45+ total)
  {
    id: '201', name: 'Nico Collins', team: 'HOU', position: 'WR', byeWeek: 14, adp: 28.5, projectedPointsStd: 162.4, projectedPointsPpr: 228.4, isDrafted: false,
    rawMetrics: '80 Receptions, 1,297 Yards, 8 TDs. 3.11 Yards Per Route Run (elite).',
    coachingChanges: 'Slowik OC. Addition of Stefon Diggs condenses the target tree.',
    recentNews: 'Collins secures massive contract extension, locked in as top target.'
  },
  {
    id: '202', name: 'Brandon Aiyuk', team: 'SF', position: 'WR', byeWeek: 9, adp: 30.1, projectedPointsStd: 168.2, projectedPointsPpr: 222.1, isDrafted: false,
    rawMetrics: '75 Receptions, 1,342 Yards, 7 TDs. Historic 17.9 yards per catch.',
    coachingChanges: 'Shanahan HC. Highly efficient vertical spacing scheme.',
    recentNews: 'Contract holdout drama ends with high salary, ready for action.'
  },
  {
    id: '203', name: 'Davante Adams', team: 'LV', position: 'WR', byeWeek: 6, adp: 22.4, projectedPointsStd: 152.4, projectedPointsPpr: 220.5, isDrafted: false,
    rawMetrics: '103 Receptions, 1,144 Yards, 8 TDs. Target monster but down efficiency.',
    coachingChanges: 'Getsy OC. Luke Getsy worked with Adams previously in Green Bay.',
    recentNews: 'Adams excited about stable quarterbacking from Gardner Minshew.'
  },
  {
    id: '204', name: 'Mike Evans', team: 'TB', position: 'WR', byeWeek: 11, adp: 34.2, projectedPointsStd: 158.4, projectedPointsPpr: 212.1, isDrafted: false,
    rawMetrics: '79 Receptions, 1,255 Yards, 13 TDs. 10 consecutive 1,000-yard years.',
    coachingChanges: 'Coen OC. Mike Evans remains primary red-zone target.',
    recentNews: 'Evans claims physical shape feels identical to his mid-20s.'
  },
  {
    id: '205', name: 'Deebo Samuel Sr.', team: 'SF', position: 'WR', byeWeek: 9, adp: 32.5, projectedPointsStd: 164.1, projectedPointsPpr: 215.4, isDrafted: false,
    rawMetrics: '60 Receptions, 892 Yards, 7 TDs. 225 Rushing Yards, 5 rushing TDs.',
    coachingChanges: 'Shanahan continues to engineer dynamic backfield/receiver carries.',
    recentNews: 'Reporters claim Samuel is looking lean and ready for dual roles.'
  },
  {
    id: '206', name: 'Chris Olave', team: 'NO', position: 'WR', byeWeek: 12, adp: 25.4, projectedPointsStd: 148.5, projectedPointsPpr: 218.4, isDrafted: false,
    rawMetrics: '87 Receptions, 1,123 Yards, 5 TDs. High air yard share (38%).',
    coachingChanges: 'Klint Kubiak OC. Expected to introduce pre-snap motion for Olave.',
    recentNews: 'Praise claims Olave has polished his deep routes with Carr.'
  },
  {
    id: '207', name: 'Malik Nabers', team: 'NYG', position: 'WR', byeWeek: 11, adp: 42.1, projectedPointsStd: 144.2, projectedPointsPpr: 208.5, isDrafted: false,
    rawMetrics: '6th Overall Pick. Elite athleticism and yards-after-catch at LSU.',
    coachingChanges: 'Brian Daboll HC calling plays, focusing on isolated target share.',
    recentNews: 'Puff pieces claim Nabers is already dominating first team cornerbacks.'
  },
  {
    id: '208', name: 'D.K. Metcalf', team: 'SEA', position: 'WR', byeWeek: 10, adp: 45.8, projectedPointsStd: 150.1, projectedPointsPpr: 202.4, isDrafted: false,
    rawMetrics: '66 Receptions, 1,114 Yards, 8 TDs. 16.9 yards per reception.',
    coachingChanges: 'Ryan Grubb OC setup will stretch field vertically for Metcalf.',
    recentNews: 'Metcalf says vertical routes in new system are incredibly fun.'
  },
  {
    id: '209', name: 'Stefon Diggs', team: 'HOU', position: 'WR', byeWeek: 14, adp: 38.2, projectedPointsStd: 138.4, projectedPointsPpr: 205.1, isDrafted: false,
    rawMetrics: '107 Receptions, 1,183 Yards, 8 TDs with Bills. Slowed down late.',
    coachingChanges: 'Slowik OC. Diggs expected to move around slot to preserve snaps.',
    recentNews: 'Diggs says he is happy to play wherever requested to secure wins.'
  },
  {
    id: '210', name: 'Cooper Kupp', team: 'LAR', position: 'WR', byeWeek: 6, adp: 35.1, projectedPointsStd: 140.2, projectedPointsPpr: 208.4, isDrafted: false,
    rawMetrics: '59 Receptions, 737 Yards, 5 TDs in 12 active games (hamstrung).',
    coachingChanges: 'McVay HC. When Kupp and Nacua are active, target concentration is elite.',
    recentNews: 'McVay says Kupp looks 100% healthy, moving with classic 2021 explosiveness.'
  },
  {
    id: '211', name: 'DJ Moore', team: 'CHI', position: 'WR', byeWeek: 7, adp: 41.5, projectedPointsStd: 144.5, projectedPointsPpr: 206.1, isDrafted: false,
    rawMetrics: '96 Receptions, 1,364 Yards, 8 TDs. Career best year in 2025.',
    coachingChanges: 'Shane Waldron OC. Added Caleb Williams at QB, Keenan Allen/Odunze at WR.',
    recentNews: 'Moore says Chicago WR depth makes it impossible to double-team anyone.'
  },
  {
    id: '212', name: 'Jaylen Waddle', team: 'MIA', position: 'WR', byeWeek: 6, adp: 36.4, projectedPointsStd: 142.1, projectedPointsPpr: 204.5, isDrafted: false,
    rawMetrics: '72 Receptions, 1,014 Yards, 4 TDs in 14 active games.',
    coachingChanges: 'McDaniel OC. Insulated role, elite speed threat.',
    recentNews: 'Waddle secures extension, locked in as top secondary pass target.'
  },
  {
    id: '213', name: 'DeVonta Smith', team: 'PHI', position: 'WR', byeWeek: 5, adp: 44.1, projectedPointsStd: 138.5, projectedPointsPpr: 201.2, isDrafted: false,
    rawMetrics: '81 Receptions, 1,066 Yards, 7 TDs. High snap participation.',
    coachingChanges: 'Kellen Moore OC typically uses slot alignments to free Smith.',
    recentNews: 'Smith says Moore\'s offense lets him run routes with higher tempo.'
  },
  {
    id: '214', name: 'Zay Flowers', team: 'BAL', position: 'WR', byeWeek: 14, adp: 54.2, projectedPointsStd: 125.4, projectedPointsPpr: 188.4, isDrafted: false,
    rawMetrics: '77 Receptions, 858 Yards, 5 TDs. Command of intermediate screen work.',
    coachingChanges: 'Monken OC. Flowers remains primary high-value target earner.',
    recentNews: 'Flowers has worked extensively on vertical release route variants.'
  },
  {
    id: '215', name: 'Tee Higgins', team: 'CIN', position: 'WR', byeWeek: 7, adp: 58.5, projectedPointsStd: 132.1, projectedPointsPpr: 185.4, isDrafted: false,
    rawMetrics: '42 Receptions, 656 Yards, 5 TDs in 12 active games.',
    coachingChanges: 'Pitcher stays OC, Taylor calling plays. Spread 11 personnel.',
    recentNews: 'Higgins signed franchise tag, motivated for massive contract year.'
  },

  // ADDING EXCELLENT DEPTH OF TEs (20+ total)
  {
    id: '301', name: 'Trey McBride', team: 'ARI', position: 'TE', byeWeek: 11, adp: 45.2, projectedPointsStd: 120.4, projectedPointsPpr: 178.4, isDrafted: false,
    rawMetrics: '81 Receptions, 825 Yards, 3 TDs. Commands a elite 27% target share.',
    coachingChanges: 'Petzing OC. Tight ends are heavily targeted inside intermediate spaces.',
    recentNews: 'Murray says Trey McBride is his absolute go-to favorite option on third downs.'
  },
  {
    id: '302', name: 'Mark Andrews', team: 'BAL', position: 'TE', byeWeek: 14, adp: 50.1, projectedPointsStd: 118.5, projectedPointsPpr: 172.4, isDrafted: false,
    rawMetrics: '45 Receptions, 544 Yards, 6 TDs in 10 active games (fibula fracture).',
    coachingChanges: 'Monken OC. Tight ends remain critical red-zone factors for Lamar.',
    recentNews: 'Andrews reports leg is 100% restored, running without stiffness.'
  },
  {
    id: '303', name: 'Dalton Kincaid', team: 'BUF', position: 'TE', byeWeek: 12, adp: 55.4, projectedPointsStd: 112.4, projectedPointsPpr: 168.1, isDrafted: false,
    rawMetrics: '73 Receptions, 673 Yards, 2 TDs. Historic high rookie catches.',
    coachingChanges: 'Joe Brady stays OC. Diggs trade leaves massive intermediate target void.',
    recentNews: 'Allen says Kincaid will operate essentially as our primary slot receiver.'
  },
  {
    id: '304', name: 'George Kittle', team: 'SF', position: 'TE', byeWeek: 9, adp: 62.1, projectedPointsStd: 124.5, projectedPointsPpr: 160.2, isDrafted: false,
    rawMetrics: '65 Receptions, 1,020 Yards, 6 TDs. High vertical efficiency.',
    coachingChanges: 'Shanahan HC. Highly dependent on run-block integrity and play-action.',
    recentNews: 'Kittle says physical shape feels superb, ready for physical blocking.'
  },
  {
    id: '305', name: 'Evan Engram', team: 'JAX', position: 'TE', byeWeek: 12, adp: 68.4, projectedPointsStd: 105.4, projectedPointsPpr: 162.1, isDrafted: false,
    rawMetrics: 'Commanded a historic 114 receptions for 963 yards and 4 TDs.',
    coachingChanges: 'Press Taylor OC. Heavily reliant on short horizontal screens.',
    recentNews: 'Lawrence states Engram remains the security blanket of our offense.'
  },
  {
    id: '306', name: 'Jake Ferguson', team: 'DAL', position: 'TE', byeWeek: 7, adp: 82.1, projectedPointsStd: 98.4, projectedPointsPpr: 148.5, isDrafted: false,
    rawMetrics: '71 Receptions, 761 Yards, 5 TDs. Elite 23 red-zone targets.',
    coachingChanges: 'McCarthy HC. Tight ends are heavily targeted on seams.',
    recentNews: 'Prescott says Ferguson is primed for a double-digit touchdown campaign.'
  },
  {
    id: '307', name: 'David Njoku', team: 'CLE', position: 'TE', byeWeek: 10, adp: 85.5, projectedPointsStd: 102.1, projectedPointsPpr: 145.4, isDrafted: false,
    rawMetrics: '81 Receptions, 882 Yards, 6 TDs. Elite target run with Flacco.',
    coachingChanges: 'Ken Dorsey takes over OC. Setup could expand downfield targets.',
    recentNews: 'Njoku says he and Watson have dialed in perfect intermediate chemistry.'
  },
  {
    id: '308', name: 'Brock Bowers', team: 'LV', position: 'TE', byeWeek: 6, adp: 90.2, projectedPointsStd: 95.4, projectedPointsPpr: 138.2, isDrafted: false,
    rawMetrics: '13th Overall Pick. Historical prospect status from Georgia.',
    coachingChanges: 'Getsy OC. Intends to use Bowers in heavy H-back and slot alignments.',
    recentNews: 'Camp observers state Bowers is completely unguardable in open space.'
  },

  // ADDING EXCELLENT DEPTH OF KICKERS (15+ total)
  {
    id: '401', name: 'Brandon Aubrey', team: 'DAL', position: 'K', byeWeek: 7, adp: 130.4, projectedPointsStd: 155.0, projectedPointsPpr: 155.0, isDrafted: false,
    rawMetrics: '36 of 38 field goals made, including 10 of 10 from 50+ yards as a rookie.',
    coachingChanges: 'McCarthy HC. Highly efficient indoor scoring environment.',
    recentNews: 'Aubrey looks completely solid in early field goal simulation practice.'
  },
  {
    id: '402', name: 'Justin Tucker', team: 'BAL', position: 'K', byeWeek: 14, adp: 135.1, projectedPointsStd: 148.0, projectedPointsPpr: 148.0, isDrafted: false,
    rawMetrics: 'Most accurate kicker in NFL history. 32 of 37 field goals in 2025.',
    coachingChanges: 'Harbaugh HC. Stable Baltimore offensive scoring drives.',
    recentNews: 'Tucker working on deep 65-yard variants during training camp.'
  },
  {
    id: '403', name: 'Harrison Butker', team: 'KC', position: 'K', byeWeek: 6, adp: 138.5, projectedPointsStd: 145.0, projectedPointsPpr: 145.0, isDrafted: false,
    rawMetrics: '33 of 35 field goals made (94.3%) in high-powered Chiefs offense.',
    coachingChanges: 'Andy Reid HC. Chiefs inside-redzone efficiency setups.',
    recentNews: 'Butker says kicking form is dialled in, confident for high usage.'
  },
  {
    id: '404', name: 'Jake Elliott', team: 'PHI', position: 'K', byeWeek: 5, adp: 142.1, projectedPointsStd: 142.0, projectedPointsPpr: 142.0, isDrafted: false,
    rawMetrics: '30 of 32 field goals made, with career best deep range.',
    coachingChanges: 'Moore OC. High-powered Eagles scoring setups.',
    recentNews: 'Elliott continues to enjoy perfect confidence from coaching staff.'
  },
  {
    id: '405', name: 'Ka\'imi Fairbairn', team: 'HOU', position: 'K', byeWeek: 14, adp: 145.2, projectedPointsStd: 140.0, projectedPointsPpr: 140.0, isDrafted: false,
    rawMetrics: '27 of 28 field goals made (96.4%). High accuracy anchor.',
    coachingChanges: 'Slowik OC. High-powered dome scoring setup.',
    recentNews: 'Fairbairn signed extension, established as long-term special teams anchor.'
  },
  {
    id: '406', name: 'Jason Sanders', team: 'MIA', position: 'K', byeWeek: 6, adp: 148.4, projectedPointsStd: 138.0, projectedPointsPpr: 138.0, isDrafted: false,
    rawMetrics: 'Commanded 24 of 28 field goals, with high-volume extra point work.',
    coachingChanges: 'McDaniel OC. Extremely high-scoring Dolphins drives.',
    recentNews: 'Sanders reports excellent leg speed in humid Miami practices.'
  },
  {
    id: '407', name: 'Evan McPherson', team: 'CIN', position: 'K', byeWeek: 7, adp: 152.1, projectedPointsStd: 136.0, projectedPointsPpr: 136.0, isDrafted: false,
    rawMetrics: '26 of 31 field goals made. High-quality deep-range distance.',
    coachingChanges: 'Taylor HC. Burrow return expands scoring volume.',
    recentNews: 'McPherson looking accurate from 55+ in early situational mocks.'
  },
  {
    id: '408', name: 'Younghoe Koo', team: 'ATL', position: 'K', byeWeek: 12, adp: 155.6, projectedPointsStd: 134.0, projectedPointsPpr: 134.0, isDrafted: false,
    rawMetrics: '32 of 37 field goals. Highly accurate intermediate range.',
    coachingChanges: 'Robinson OC. Moving to dome McVay style setup.',
    recentNews: 'Koo says upgraded Falcons offense yields higher scoring field position.'
  },
  {
    id: '409', name: 'Dustin Hopkins', team: 'CLE', position: 'K', byeWeek: 10, adp: 158.4, projectedPointsStd: 132.0, projectedPointsPpr: 132.0, isDrafted: false,
    rawMetrics: '33 of 36 field goals, with excellent outdoor clutch kicking.',
    coachingChanges: 'Stefanski HC. Reliance on defensive and field position advantages.',
    recentNews: 'Hopkins fully recovered from late season hamstring strain.'
  },
  {
    id: '410', name: 'Tyler Bass', team: 'BUF', position: 'K', byeWeek: 12, adp: 160.2, projectedPointsStd: 130.0, projectedPointsPpr: 130.0, isDrafted: false,
    rawMetrics: '24 of 29 field goals. Underwhelming accuracy late in season.',
    coachingChanges: 'Brady OC. Wind factors in Buffalo outdoor stadium.',
    recentNews: 'Bass working on wind adjustments to restore high-percent consistency.'
  },

  // ADDING EXCELLENT DEPTH OF DEFENSES / SPECIAL TEAMS (15+ total)
  {
    id: '501', name: 'San Francisco 49ers', team: 'SF', position: 'DST', byeWeek: 9, adp: 140.2, projectedPointsStd: 105.0, projectedPointsPpr: 105.0, isDrafted: false,
    rawMetrics: 'Led NFL in interceptions (22), allowed only 17.5 PPG.',
    coachingChanges: 'Nick Sorensen takes over as defensive coordinator.',
    recentNews: '49ers defense remains elite blue-chip unit with Bosa leading pass rush.'
  },
  {
    id: '502', name: 'Baltimore Ravens', team: 'BAL', position: 'DST', byeWeek: 14, adp: 142.1, projectedPointsStd: 104.0, projectedPointsPpr: 104.0, isDrafted: false,
    rawMetrics: 'Led NFL in sacks (60) and turnovers (31) last season.',
    coachingChanges: 'Zach Orr promoted to defensive coordinator.',
    recentNews: 'Orr claims defensive aggressive identity remains fully intact.'
  },
  {
    id: '503', name: 'Dallas Cowboys', team: 'DAL', position: 'DST', byeWeek: 7, adp: 145.4, projectedPointsStd: 102.0, projectedPointsPpr: 102.0, isDrafted: false,
    rawMetrics: 'Historic defensive touchdown output (17 TDs over prior 3 seasons).',
    coachingChanges: 'Mike Zimmer takes over as defensive coordinator.',
    recentNews: 'Zimmer expected to introduce highly disciplined coverage for Parsons.'
  },
  {
    id: '504', name: 'New York Jets', team: 'NYJ', position: 'DST', byeWeek: 12, adp: 148.5, projectedPointsStd: 101.0, projectedPointsPpr: 101.0, isDrafted: false,
    rawMetrics: 'Allowed lowest yards per play in NFL. High sack rate.',
    coachingChanges: 'Robert Saleh HC. Stable defensive depth charts.',
    recentNews: 'Jets defense highly motivated, expecting elite field position with Rodgers back.'
  },
  {
    id: '505', name: 'Cleveland Browns', team: 'CLE', position: 'DST', byeWeek: 10, adp: 151.1, projectedPointsStd: 100.0, projectedPointsPpr: 100.0, isDrafted: false,
    rawMetrics: 'Allowed lowest completion rate and lowest passing yards.',
    coachingChanges: 'Jim Schwartz remains defensive coordinator.',
    recentNews: 'Schwartz states Myles Garrett looks even faster in summer camps.'
  },
  {
    id: '506', name: 'Buffalo Bills', team: 'BUF', position: 'DST', byeWeek: 12, adp: 154.2, projectedPointsStd: 98.0, projectedPointsPpr: 98.0, isDrafted: false,
    rawMetrics: 'Maintained top 5 scoring defense despite catastrophic injuries.',
    coachingChanges: 'Sean McDermott remains HC and play-caller.',
    recentNews: 'Bills secondary restructures, introducing youth and speed.'
  },
  {
    id: '507', name: 'Miami Dolphins', team: 'MIA', position: 'DST', byeWeek: 6, adp: 156.4, projectedPointsStd: 96.0, projectedPointsPpr: 96.0, isDrafted: false,
    rawMetrics: 'Ranked top 3 in sacks last year. High pressure rate.',
    coachingChanges: 'Anthony Weaver takes over as defensive coordinator.',
    recentNews: 'Weaver plans to deploy high blitz rates and hybrid packages.'
  },
  {
    id: '508', name: 'Pittsburgh Steelers', team: 'PIT', position: 'DST', byeWeek: 9, adp: 158.1, projectedPointsStd: 95.0, projectedPointsPpr: 95.0, isDrafted: false,
    rawMetrics: 'Elite playmaking unit anchored by T.J. Watt. High sack rate.',
    coachingChanges: 'Teryl Austin defensive setups focusing on turnovers.',
    recentNews: 'Watt says Steelers defensive line depth is best of his career.'
  }
];
