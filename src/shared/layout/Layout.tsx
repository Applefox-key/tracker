import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/features/auth/store/authStore";
import { DemoBanner } from "@/features/auth/components/DemoBanner";
import { DarkModeToggle } from "@/shared/ui/DarkModeToggle";
import { LanguageSwitcher } from "@/shared/ui/LanguageSwitcher";
import { useEntriesData } from "@/hooks/useEntriesData";
import { useEntriesStore } from "@/features/entries/store/entriesStore";
import { getAvatarUrl } from "@/api/api";
import { ImStatsBars } from "react-icons/im";
import { PiCardsThree } from "react-icons/pi";
import { TbTargetArrow } from "react-icons/tb";
import { IoPricetagsOutline } from "react-icons/io5";

const APPS = [
  {
    name: "FlashMinds",
    desc: "Collections & flashcards",
    href: "https://flashcards.learnypie.com",
    current: false,
    iconBg: "#eef2ff",
    iconColor: "#4f46e5",
  },
  {
    name: "SayLoop",
    desc: "90-second method",
    href: "https://phrasely.learnypie.com",
    current: false,
    iconBg: "#faf5ff",
    iconColor: "#0d9488",
  },
  {
    name: "Tracker",
    desc: "Progress & vocabulary",
    href: "https://tracker.learnypie.com",
    current: true,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
  },
] as const;

export function Layout() {
  const { t } = useTranslation();
  const { isAuthenticated, mode, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isGameRoute = [
    "/flashcards",
    "/practice/quiz",
    "/practice/match",
    "/practice/puzzle",
    "/practice/due",
    "/practice/write",
    "/practice/custom",
    "/practice/auto-flashcards",
  ].includes(location.pathname);
  const [appsOpen, setAppsOpen] = useState(false);
  const [burgerOpen, setBurgerOpen] = useState(false);

  const isDashboard = location.pathname === "/dashboard";
  const hour = new Date().getHours();
  const motivationKey =
    hour < 12 ? "layout.motivateMorning" : hour < 18 ? "layout.motivateAfternoon" : "layout.motivateEvening";

  const navItems = [
    { to: "/dashboard", labelKey: "nav.dashboard", icon: <ImStatsBars /> },
    { to: "/entries", labelKey: "nav.entries", icon: <PiCardsThree /> },
    { to: "/practice", labelKey: "nav.practice", icon: <TbTargetArrow /> },
    { to: "/tags", labelKey: "nav.tags", icon: <IoPricetagsOutline /> },
    { to: "/about", labelKey: "nav.about", icon: "ℹ️" },
  ];

  useEffect(() => {
    if (!appsOpen) return;
    const handler = (e: MouseEvent) => {
      const el = document.getElementById("apps-dropdown-root");
      if (el && !el.contains(e.target as Node)) setAppsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [appsOpen]);

  const dueCount = useEntriesStore((s) => s.dueCount);

  useEntriesData();

  const RocketIcon = ({ size = 32, className = "" }) => {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1095 1095"
        width={size}
        height={size}
        className={className}
        fill="currentColor">
        <path
          d="M537.07 827.5C527.78 824.4 519.44 819.96 510.5 816.22C505.15 825.06 503.2 834.45 494.92 841.45C478.27 855.52 455.09 856.64 437.25 844.28C423.85 834.99 413.4 821.02 402.07 809.42C378.85 785.65 355.79 761.66 333.23 737.26C322.2 725.33 310.24 714.24 299.18 702.31C292.14 694.72 284.57 687.45 281.18 677.4C274.96 658.96 281.08 637.02 296.53 625.01C301.77 620.93 307.99 619.07 314.01 616.5C312.48 610.78 308.1 606.1 306.25 600.33C303.66 592.28 303.77 583.74 301.5 575.7C291.21 573.98 270.7 577.84 259.5 578.83C230.84 581.35 202.13 583.41 173.5 586.25C149.04 588.67 122.34 592.72 102.02 575.49C76.52 553.89 81.84 522.12 92.72 494.26C114.5 438.51 149.95 388.72 191.21 345.72C238.45 296.49 300.55 258.97 367.73 245.36C387.11 241.44 406.72 239.13 426.5 238.94C433.48 238.87 440.52 238.73 447.5 239.05C451.27 239.22 454.42 240.11 458.04 238.51C462.36 236.6 465.93 232.01 469.54 229.02C476.66 223.14 483.83 217.27 491.08 211.55C514.06 193.41 538.02 176.21 562.14 159.61C598.34 134.69 637.8 113.8 677.37 94.84C711.52 78.49 746.45 63.21 782.77 52.36C841.68 34.76 901.14 20.21 962.5 14.77C995.04 11.89 1031.31 13.12 1056.04 37.46C1072.59 53.76 1079.67 76.07 1083.19 98.48C1089.82 140.64 1086.34 184.52 1080.21 226.53C1063.54 340.71 1024.79 450.74 965.31 549.77C945.54 582.71 924.69 615.3 901.4 645.87C893.49 656.27 885.46 666.58 877.36 676.83C874.4 680.57 869.47 683.73 867.73 688.29C866.33 691.94 870.92 707.7 871.75 712.55C874.97 731.43 876.5 750.34 876.03 769.5C874.69 823.57 852.79 876.96 819.98 919.47C774.33 978.64 706.8 1019.83 634.53 1037.11C618.69 1040.9 601.87 1044.36 585.5 1042.88C562.6 1040.81 541.12 1028.31 528.51 1008.98C512.69 984.71 515.41 956.72 519.75 929.45C522.92 909.47 526.56 889.56 530.34 869.68C532.13 860.26 534.35 850.92 536.1 841.5C536.94 837.01 538.22 831.93 537.07 827.5ZM983.6 38.43C946.87 40.24 911.23 46.28 875.27 53.64C782.64 72.61 692.02 107.33 611.1 156.59C578.91 176.2 547.39 196.95 517.62 220.09C506.21 228.96 494.82 237.93 483.66 247.13C477.93 251.86 472.76 258.33 465.78 261.32C456.3 265.38 444.42 262.27 434.5 261.97C418.57 261.49 402.28 262.93 386.53 265.23C340.24 271.97 295.18 291.47 257.24 318.71C200.72 359.29 161 411.15 128.86 472.36C118.63 491.86 100.7 524.19 109.35 546.2C118.69 569.99 147.39 565.67 167.87 563.47C201.31 559.88 234.98 557.68 268.5 554.84C282.11 553.69 302.18 548.2 315.02 553.49C330.34 559.81 324.09 580.58 328.57 592.89C332.5 603.7 351.42 619.81 360.03 628.47C396.24 664.92 431.5 702.36 467.02 739.49C478.27 751.24 489.67 762.82 501 774.5C505.77 779.41 510.02 784.8 515.12 789.39C521.63 795.24 529.41 800.02 537.77 802.66C544.17 804.69 551.55 805.03 556.71 809.8C562.58 815.21 562.34 823.27 561.32 830.57C559.92 840.61 557.91 850.54 556.05 860.5C552.4 880.09 549.18 899.75 545.68 919.37C542.95 934.65 539.81 949.89 539.92 965.5C540.08 986.34 547.9 1005.77 567.84 1014.61C594.79 1026.55 626.31 1017.63 652.74 1008.29C710.58 987.84 763.89 954.24 801.8 905.29C833.71 864.08 853.57 811.95 852.92 759.5C852.7 742.09 850.03 724.63 846.72 707.58C844.99 698.64 840.16 689.17 843.53 680.04C845.53 674.63 850.29 670.67 853.85 666.31C860.31 658.42 866.65 650.42 872.9 642.36C891.85 617.92 909.33 592.47 925.82 566.31C980 480.34 1022.06 385.93 1043.89 286.48C1056.36 229.69 1063.46 170.62 1058.96 112.5C1056.51 80.83 1043.6 47.92 1009.37 40.24C1001.18 38.4 991.98 38.02 983.6 38.43ZM980.59 75.42C985.78 75.07 991.33 75.28 996.47 76.15C1023.2 80.67 1021.78 113.74 1022.09 134.5C1022.91 190.93 1013.7 246.89 999.8 301.44C975.8 395.58 933.19 485.29 879.87 566.33C862.38 592.91 843.45 618.27 823.86 643.31C818.46 650.21 813.04 657.16 807.07 663.58C804.15 666.71 799.22 670.01 797.57 674.06C795.34 679.54 799.63 690.78 800.66 696.67C803.58 713.25 806.53 729.74 807.59 746.58C810.19 788.17 797.83 830.04 775.42 864.9C745.57 911.32 700.19 946.55 649 966.51C637.21 971.11 625.02 974.48 612.7 977.32C606.34 978.78 598.96 980.45 592.68 977.81C572.31 969.28 580.91 941.71 583.62 925.29C589.29 890.88 593.85 856.12 598.29 821.53C600.14 807.11 604.27 790.6 592.11 779.41C584.95 772.81 575.79 772.88 566.74 771.59C556.59 770.15 547.17 766.92 539.15 760.37C532.05 754.58 526.25 747.16 519.92 740.58C507.01 727.16 494.04 713.8 481.3 700.21C449.55 666.35 416.83 633.32 384.4 600.1C375.59 591.07 368.58 582.5 367.13 569.5C365.23 552.5 372.03 528.94 353.3 519.2C339.96 512.27 323.62 517.1 309.5 518.07C274.73 520.47 239.94 523.21 205.26 526.56C198.35 527.23 191.41 527.45 184.5 528.15C178.88 528.72 173.18 530.16 167.51 529.7C162.06 529.26 156.52 526.31 154.57 520.91C152.1 514.09 155.1 507.47 157.65 501.2C163.11 487.76 169.52 474.86 176.82 462.33C207.83 409.12 250.11 360.07 304.71 330.22C337.73 312.16 373.83 300.35 411.5 297.73C425.51 296.76 439.5 297.17 453.5 297.97C459.85 298.34 467.93 301.06 474.01 298.48C478.86 296.42 483.06 290.92 486.95 287.46C495.8 279.61 505.24 272.28 514.62 265.08C547.14 240.15 580.15 215.99 615.19 194.65C725.87 127.27 851.02 84.09 980.59 75.42ZM993.75 101.5C982.99 97.35 964.95 101.36 953.44 102.66C922.36 106.18 891.81 111.45 861.39 118.74C758.67 143.36 671.99 183.16 584.61 242.07C561.52 257.63 539.39 274.72 517.67 292.12C508.8 299.23 499.91 306.38 491.15 313.63C488.25 316.03 485.62 318.95 482.29 320.8C475.53 324.55 466.77 322.62 459.5 322.06C445.5 321 431.57 320.54 417.5 320.9C383.37 321.79 350.61 332.25 320.57 348.07C273.33 372.96 236.7 412.04 207.89 456.36C200.98 467 194.36 477.91 188.82 489.33C186.56 493.99 183.26 499.41 183.42 504.5C193.59 506.01 212.47 502.13 223.5 501.14C251.13 498.67 278.86 497.19 306.5 494.82C323.45 493.37 341.75 489.03 358.25 495.3C376.69 502.3 389.98 519.63 390.96 539.5C391.51 550.72 387.55 564.06 392.88 574.58C397.49 583.67 407.6 590.69 414.6 597.89C429.23 612.94 443.58 628.24 458.11 643.38C479.99 666.18 501.94 688.9 523.9 711.61C531.11 719.06 538.35 726.49 545.55 733.96C548.95 737.49 552.14 741.47 556.11 744.41C564.79 750.84 576.34 748.22 586.29 750.33C602.59 753.78 616.49 768.37 621.64 783.79C627.67 801.89 621.98 821.38 619.24 839.54C615.42 864.8 612.62 890.21 608.81 915.47C607.01 927.39 601.18 943.75 603.87 955.5C619.14 955.9 640.95 945.82 654.89 939.41C702.86 917.35 743.96 880.34 766.98 832.49C781.92 801.43 787.22 766.74 782.74 732.54C780.72 717.12 777.88 701.77 774.94 686.5C773.52 679.08 770.82 671.11 774.41 663.87C776.94 658.75 781.71 655.09 785.44 650.92C792.37 643.18 798.92 634.99 805.36 626.84C825.95 600.77 845.72 574.1 863.47 545.99C898.2 490.99 929 433.33 951.7 372.26C965.73 334.51 975.78 294.87 984.25 255.56C992.02 219.51 996.57 182.42 996.96 145.5C997.05 136.12 996.57 126.86 996.11 117.5C995.84 112.1 996.04 106.49 993.75 101.5ZM650.66 246.36C673.06 243.26 692.67 264.1 708.73 276.77C752.68 311.44 795.84 347.08 839.96 381.52C858.56 396.04 881.12 409.85 874.75 437.37C872.04 449.04 862.76 455.76 853.13 461.61C836.77 471.54 819.12 479.69 802.23 488.7C736.72 523.64 671.02 558.35 605.19 592.66C592.28 599.38 579.27 605.97 566.53 613.01C554.64 619.58 541.76 626.48 527.85 622.57C512.85 618.34 503.81 602.6 505.13 587.5C505.78 580.14 509.24 573.15 511.74 566.29C515.3 556.47 518.86 546.66 522.39 536.83C548.7 463.49 576.91 390.8 602.73 317.3C606.27 307.22 609.92 297.2 613.63 287.19C620.96 267.45 627.06 249.62 650.66 246.36ZM652.77 268.39C644.14 270.07 641.4 278.02 638.82 285.36C633.55 300.37 627.98 315.27 622.73 330.29C599.79 396 574.96 461.14 550.86 526.44C546.35 538.66 542.19 551.01 537.65 563.21C535.23 569.7 532.06 575.88 529.92 582.48C527.65 589.49 527.13 598.93 535.5 602.06C542.44 604.65 549.44 598.8 555.14 595.62C569.8 587.46 584.9 580.11 599.7 572.2C661.86 538.93 724.18 505.95 786.53 473.02C803.11 464.26 819.8 455.73 836.26 446.74C843 443.06 852.15 439.86 853.61 431.25C854.85 423.9 850.14 418.92 844.98 414.51C834.89 405.89 824.2 397.96 813.94 389.55C775.26 357.85 735.95 326.8 696.73 295.77C688.18 289 679.69 282.15 671.1 275.43C665.83 271.3 659.88 266.99 652.77 268.39ZM665.58 318.2C679.01 314.99 690.75 328.85 700.05 336.47C724.95 356.9 750.17 377.12 775.56 396.96C785 404.33 802.63 413.21 801.04 427.5C800.35 433.66 795.08 436.84 790.22 439.69C779.63 445.88 768.69 451.58 757.9 457.41C718.12 478.92 678.49 500.75 638.66 522.18C629.99 526.84 621.31 531.48 612.64 536.15C607 539.19 601.49 542.57 594.83 540.58C589.13 538.88 586.02 532.28 586.42 526.68C587.22 515.62 594.3 502.16 598.29 491.76C614.95 448.39 629.13 404.08 644.81 360.36C648.42 350.29 652.07 340.24 655.58 330.13C657.3 325.18 659.97 319.55 665.58 318.2ZM674.5 345.94C668.27 359.05 664.49 373.6 659.75 387.3C650.85 412.99 641.92 438.66 632.65 464.22C629.28 473.52 626.12 482.91 622.62 492.17C620.66 497.37 617.37 502.74 618.5 508.25C669.71 480.34 720.92 452.42 772.14 424.5C767.86 417.6 757.05 411.2 750.58 405.95C734.38 392.78 717.8 380.08 701.57 366.95C693.64 360.53 684.08 349.19 674.5 345.94ZM322.78 637.39C306.22 640.19 296.51 660.6 306.62 674.86C310.19 679.9 315 683.83 319.29 688.22C328.99 698.18 338.72 708.12 348.42 718.09C375.05 745.46 401.1 773.4 427.88 800.63C440.41 813.38 458.32 840.31 478.38 823.92C480.83 821.92 482.74 819.49 484.26 816.73C494.37 798.39 479.48 787.27 468.28 775.23C435.52 740.01 400.98 706.49 368.16 671.32C361.72 664.43 355.04 657.77 348.57 650.91C341.27 643.17 334.7 635.38 322.78 637.39ZM183.69 748.44C215.96 746.31 234.99 780.2 222.85 808.36C219.27 816.65 212.6 822.63 206.65 829.16C197.29 839.45 187.63 849.47 178.08 859.59C156.73 882.22 135.18 904.68 113.84 927.33C101.73 940.19 90.32 954.95 76.12 965.6C60.88 977.03 38.93 977.89 23.62 965.93C7.31 953.18 4.09 927.71 15.14 910.66C23.76 897.37 36.66 886.46 47.32 874.8C74.19 845.39 102.6 817.35 129.34 787.83C144.39 771.21 159.32 750.05 183.69 748.44ZM180.79 770.4C174.33 771.71 169.97 776.54 165.58 781.08C157.53 789.39 149.84 798 141.99 806.49C112.24 838.68 82.72 871.22 51.88 902.38C40.62 913.75 18.95 933.59 37.85 948.61C56.66 963.56 74.04 936.77 85.47 924.97C111.05 898.55 136.03 871.53 161.47 844.96C169.78 836.27 177.94 827.43 186.27 818.75C191.67 813.13 197.62 807.95 201.8 801.3C211.24 786.27 198.29 766.86 180.79 770.4ZM295.66 804.31C331.28 798.38 354.56 837.14 339.25 867.72C334.04 878.13 325.18 886.44 317.08 894.59C306.63 905.12 296.47 915.99 286.15 926.66C245.83 968.31 204.06 1008.58 162.88 1049.38C146.23 1065.88 126.51 1085.41 101.06 1074.46C97.01 1072.72 93.09 1070.63 89.6 1067.94C69.8 1052.65 70.03 1024.89 85.06 1006.59C89.83 1000.78 95.6 995.71 100.89 990.39C108.88 982.38 116.8 974.3 124.69 966.2C159.71 930.22 195.49 895 230.14 858.65C239.09 849.27 248.3 840.14 257.23 830.74C268.11 819.28 279.28 807.04 295.66 804.31ZM296.76 826.36C289.18 828.14 284.27 834.32 279.11 839.6C268.89 850.06 258.9 860.73 248.64 871.14C209.42 910.93 170.28 950.78 131.38 990.87C124.16 998.32 116.85 1005.69 109.55 1013.06C105.9 1016.75 101.74 1020.1 99.29 1024.77C94.85 1033.18 95.93 1044.77 103.55 1050.97C109.82 1056.06 118.73 1056.91 125.92 1053.42C131.12 1050.89 135.05 1045.59 139.14 1041.64C147.44 1033.61 155.65 1025.48 163.88 1017.38C197.31 984.47 230.41 951.26 263.47 917.97C275.1 906.25 286.51 894.35 297.97 882.47C304.46 875.76 311.66 869.24 317.26 861.75C329.35 845.62 318.29 821.28 296.76 826.36ZM371.75 895.45C401.45 893.52 421.51 925.76 410.83 952.33C404.2 968.83 387.9 980.05 375.56 992.06C357.32 1009.81 338.63 1027.13 320.63 1045.13C309.62 1056.15 298.98 1069.98 285.13 1077.6C270.53 1085.62 252.12 1084.8 238.65 1074.91C222.42 1062.99 218.78 1039.9 228.11 1022.62C236.32 1007.41 252.31 995.84 264.68 984.17C285.56 964.48 306.02 944.12 326.19 923.7C339.17 910.55 352.18 896.72 371.75 895.45ZM369.75 917.38C356.66 919.66 343.05 937.43 334.12 946.61C308.17 973.29 281.12 999.03 254.36 1024.87C245.11 1033.8 240.65 1048.02 251.91 1057.57C266.35 1069.82 281.04 1053.33 290.97 1043.48C312.74 1021.91 334.91 1000.72 357.07 979.57C363.72 973.22 370.34 966.85 376.97 960.48C381.18 956.45 386.07 952.71 389.1 947.63C397.2 934.06 386.29 914.5 369.75 917.38Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="0.25"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const navLinkCls = ({ isActive }: { isActive: boolean }) =>
    [
      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-fit",
      isActive
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white",
    ].join(" ");

  const bottomNavLinkCls = ({ isActive }: { isActive: boolean }) =>
    [
      "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-xs font-medium transition-colors min-w-[52px]",
      isActive
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
    ].join(" ");

  const AppCard = ({ app }: { app: (typeof APPS)[number] }) =>
    app.current ? (
      <div className="flex items-center gap-3 p-2.5 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 cursor-default">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: app.iconBg }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={app.iconColor}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-green-800 dark:text-green-400">{app.name}</p>
          <p className="text-xs text-green-500 leading-tight truncate">{app.desc}</p>
        </div>
        <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded px-1.5 py-0.5 shrink-0">
          {t("layout.appNow")}
        </span>
      </div>
    ) : (
      <a
        href={app.href}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors no-underline">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: app.iconBg }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={app.iconColor}>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{app.name}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight truncate">{app.desc}</p>
        </div>
      </a>
    );

  return (
    <div className="min-h-screen flex flex-col">
      <header
        className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30${isGameRoute ? " hidden sm:block" : ""}`}>
        {/* ── Row 1 ── */}
        <div className="max-w-full 3xl:max-w-[2000px] mx-auto px-4 sm:px-6 relative flex items-center justify-between h-16">
          {/* Left: due badge (mobile) | logo (desktop) */}
          <div className="flex items-center gap-2">
            {/* Logo - desktop only */}
            <RocketIcon className="hidden sm:inline text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline text-xl font-bold text-emerald-600 tracking-tight">
              {t("layout.logo")}
            </span>
          </div>

          {/* Title / Greeting - mobile only, absolutely centered */}
          {isDashboard ? (
            <div className="sm:hidden absolute left-3  flex flex-col items-left pointer-events-none">
              <span className="text-base font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {user?.name ? t("layout.greeting", { name: user.name.split(" ")[0] }) : t("layout.greetingAnon")}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{t(motivationKey)}</span>
            </div>
          ) : (
            <span className="sm:hidden absolute left-3 text-xl font-bold text-emerald-600 tracking-tight whitespace-nowrap pointer-events-none">
              {t("layout.logo")}
            </span>
          )}

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems
              .filter(({ to }) => !(isAuthenticated && to === "/about"))
              .map(({ to, labelKey, icon }) => (
                <NavLink key={to} to={to} end className={navLinkCls}>
                  <span>{icon}</span>
                  <span>{t(labelKey)}</span>
                </NavLink>
              ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1">
            {/* Theme toggle - desktop only; on mobile it lives inside the burger menu */}
            <div className="hidden sm:block">
              <DarkModeToggle />
            </div>

            {/* Language switcher - desktop only; on mobile it lives inside the burger menu */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Apps dropdown - desktop only */}
            <div id="apps-dropdown-root" className="relative hidden sm:block">
              <button
                onClick={() => setAppsOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm border transition-colors ${
                  appsOpen
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <rect x="1" y="1" width="5" height="5" rx="1.5" />
                  <rect x="10" y="1" width="5" height="5" rx="1.5" />
                  <rect x="1" y="10" width="5" height="5" rx="1.5" />
                  <rect x="10" y="10" width="5" height="5" rx="1.5" />
                </svg>
                <span>{t("layout.apps")}</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  style={{ transform: appsOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                  <path d="M2 3l3 3 3-3" />
                </svg>
              </button>
              {appsOpen && (
                <div className="absolute right-0 top-10 z-[50] w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3">
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 px-1">
                    {t("layout.appsLabel")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {APPS.map((app) =>
                      app.current ? (
                        <div
                          key={app.name}
                          className="flex flex-col gap-1 p-2.5 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/20 cursor-default">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center mb-1"
                            style={{ background: app.iconBg }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={app.iconColor}>
                              <rect x="2" y="3" width="20" height="14" rx="2" />
                              <path d="M8 21h8M12 17v4" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-green-800 dark:text-green-400">{app.name}</span>
                          <span className="text-xs text-green-500 dark:text-green-500 leading-tight">{app.desc}</span>
                          <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 rounded px-1.5 py-0.5 w-fit mt-0.5">
                            {t("layout.appCurrent")}
                          </span>
                        </div>
                      ) : (
                        <a
                          key={app.name}
                          href={app.href}
                          target="_blank"
                          rel="noreferrer"
                          className="flex flex-col gap-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors no-underline cursor-pointer">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center mb-1"
                            style={{ background: app.iconBg }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill={app.iconColor}>
                              <rect x="2" y="3" width="20" height="14" rx="2" />
                              <path d="M8 21h8M12 17v4" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{app.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 leading-tight">{app.desc}</span>
                        </a>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-1 ml-1">
                {mode === "authenticated" && user?.name && (
                  <Link to="/profile" title={t("layout.profile")}>
                    {user?.img ? (
                      <img
                        src={getAvatarUrl(user.img, user.id) ?? undefined}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-600 hover:ring-2 hover:ring-emerald-400 transition-all"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-medium hover:ring-2 hover:ring-emerald-400 transition-all cursor-pointer">
                        {user?.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                  </Link>
                )}
                {/* Logout - desktop only */}
                <button
                  onClick={handleLogout}
                  className="hidden sm:block text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                  {mode === "demo" ? t("layout.exitDemo") : t("layout.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Burger menu overlay — mobile only ── */}
      {!isGameRoute && (
        <>
          <div
            className={`sm:hidden fixed inset-0 z-20 bg-black/40 transition-opacity duration-300 ${
              burgerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setBurgerOpen(false)}
          />
          <div
            className={`sm:hidden fixed top-0 right-0 bottom-0 z-[52] w-[100vw] max-w-full bg-white dark:bg-gray-800 shadow-xl flex flex-col transition-transform duration-300 ease-in-out ${
              burgerOpen ? "translate-x-0" : "translate-x-full"
            }`}>
            <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <button
                onClick={() => setBurgerOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
              <span className="text-base font-bold text-emerald-600">{t("layout.logo")}</span>
            </div>

            <div className="flex-1 overflow-y-auto py-3 px-3 flex flex-col gap-1">
              {/* Theme toggle */}
              <div className="flex items-center justify-between px-3 py-2 mb-1 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("layout.theme")}</span>
                <DarkModeToggle />
              </div>

              {/* Language switcher */}
              <div className="flex items-center justify-between px-3 py-2 mb-1 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("layout.language")}</span>
                <LanguageSwitcher />
              </div>

              {/* Nav items */}
              {navItems.map(({ to, labelKey, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end
                  onClick={() => setBurgerOpen(false)}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
                    ].join(" ")
                  }>
                  <span className="text-base">{icon}</span>
                  <span>{t(labelKey)}</span>
                </NavLink>
              ))}

              {/* Apps section */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                  {t("layout.appsLabel")}
                </p>
                <div className="flex flex-col gap-1.5">
                  {APPS.map((app) => (
                    <AppCard key={app.name} app={app} />
                  ))}
                </div>
              </div>
            </div>

            {isAuthenticated && (
              <div
                className="px-3 pt-2 border-t border-gray-200 dark:border-gray-700 shrink-0"
                style={{ paddingBottom: "calc(3.5rem + env(safe-area-inset-bottom))" }}>
                <button
                  onClick={() => {
                    setBurgerOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  {mode === "demo" ? t("layout.exitDemo") : t("layout.logout")}
                </button>
              </div>
            )}
            <button
              onClick={() => setBurgerOpen(false)}
              className="inline-flex items-center justify-center gap-2 font-medium transition-colors py-4
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500 px-4 py-2 text-md ">
              {t("entries.detail.close")}
            </button>
          </div>
        </>
      )}

      <DemoBanner />

      <main
        className={`flex-1 py-2 sm:py-8 pt-0 sm:pt-8 max-w-7xl 3xl:max-w-[2000px] w-full mx-auto px-4 sm:px-6  sm:pb-0${isGameRoute ? "" : " pb-24"}`}
        style={!isGameRoute ? { paddingBottom: "calc(5rem + env(safe-area-inset-bottom))" } : undefined}>
        <Outlet />
      </main>

      {/* Footer - desktop only */}
      <footer className="hidden sm:block border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
        {t("layout.footer")}
        {isAuthenticated && (
          <>
            {" · "}
            <NavLink
              to="/about"
              className={({ isActive }) =>
                isActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              }>
              {t("nav.about")}
            </NavLink>
          </>
        )}
      </footer>

      {/* ── Bottom navigation bar — mobile only ── */}
      <nav
        className={`${isGameRoute ? "hidden" : "sm:hidden"} fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex items-center justify-around h-14 px-1">
          {navItems
            .filter(({ to }) => to !== "/tags" && to !== "/about")
            .map(({ to, labelKey, icon }) => (
              <NavLink key={to} to={to} end className={bottomNavLinkCls} onClick={() => setBurgerOpen(false)}>
                <span className="relative text-xl leading-none">
                  {icon}
                  {to === "/practice" && dueCount !== null && dueCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-[3px] rounded-full bg-red-500 text-white text-[10px] font-bold leading-4 flex items-center justify-center pointer-events-none">
                      {dueCount > 99 ? "99+" : dueCount}
                    </span>
                  )}
                </span>
                <span>{t(labelKey)}</span>
              </NavLink>
            ))}
          <button
            onClick={() => setBurgerOpen((v) => !v)}
            className={[
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-xs font-medium transition-colors min-w-[52px]",
              burgerOpen
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
            ].join(" ")}
            aria-label={t("layout.more")}>
            <span className="text-xl leading-none">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </span>
            <span>{t("layout.more")}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
