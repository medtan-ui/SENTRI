import { safeBrowsingConfig } from '../../features/scenario/configs/safeBrowsing.config'

/**
 * safeBrowsing.js
 * Mock module data for Safe Browsing. Scenario content lives in
 * features/scenario/configs/safeBrowsing.config.js; lesson content
 * below is authored per SENTRI_Module_Content_Design.md.
 */
export const safeBrowsingModuleData = {
  moduleId: 'safe-browsing',
  title: 'Safe Browsing',
  description: 'Identify malicious websites, verify secure connections, and avoid drive-by downloads while browsing.',
  difficulty: 'Intermediate',
  previousModuleId: 'online-safety',
  // Paste a YouTube video id (or leave empty) once the lesson video for
  // this module is ready — YouTubePlayer shows a placeholder until then.
  videoId: '',

  lesson: {
    objectives: [
      'Read a web address correctly to identify which site you are actually on',
      'Interpret browser security warnings instead of dismissing them',
      'Choose a safe network and connection for sensitive accounts',
    ],
    sections: [
      {
        id: 'introduction',
        title: 'Introduction',
        content: "Your browser is where most online risk is encountered, and it is also where most of the available warning signs appear. Scam shopping sites, fake update banners, malicious extensions, and intercepted connections all leave evidence in the browser interface before anything goes wrong.\n\nIn this lesson you'll learn to read a web address, to interpret the warnings your browser produces, and to judge which network is safe enough for a banking or e-wallet login.",
      },
      {
        id: 'why-it-matters',
        title: 'Why Safe Browsing Matters',
        content: "Browsing decisions are made quickly and repeatedly. You open dozens of pages a day and you evaluate almost none of them, which is exactly the margin that scam and malware sites operate in.\n\nThe underlying problem is that a website's appearance is fully controlled by whoever built it. A convincing bank login page, a professional-looking shop, and a legitimate research repository are equally easy to construct. Design tells you about the builder's effort, never about their intent.\n\nWhat cannot be faked is the address you are connected to, and the browser displays it constantly. Learning to read it is the highest-value habit in this module.",
      },
      {
        id: 'reading-an-address',
        title: 'Reading a Web Address',
        content: "A web address has three parts, and only one of them identifies who you are talking to.\n\nThe protocol comes first — https:// means the connection is encrypted so that others on the network cannot read it. The domain comes next, ending at the first single slash. Everything after that slash is the path, and the site's owner can put any words there they like.\n\nThe domain is the part that matters. To find it, read from https:// forward to the first single slash. In an address like metroonebank.com.secure-login.xyz/account, the actual domain is secure-login.xyz — metroonebank.com is a subdomain the attacker created to sit at the front where you would expect to see it.\n\nTwo misconceptions are worth correcting directly. First, https and the padlock icon mean the connection is encrypted, not that the site is honest. Scam sites obtain certificates routinely, and most now do. Encryption protects the message in transit; it makes no claim about who is receiving it. Second, a familiar name appearing somewhere in the address is not verification. Only the domain position counts.\n\nWhen a browser interrupts you with a full-page warning that the connection is not private, it has detected that the site's certificate does not match the address you requested. This can indicate a misconfigured site, but it can also indicate that something is positioned between you and the destination reading everything you send. You cannot tell which from the warning alone, so the correct response is to leave rather than to proceed.",
      },
      {
        id: 'common-threats',
        title: 'Common Browsing Threats',
        content: "Scam shopping sites rely on a price that overrides judgment. Discounts of eighty or ninety percent on current, in-demand goods are the clearest signal, because no legitimate retailer sustains them. Before entering payment details on an unfamiliar site, look for reviews and complaints outside that site — anything hosted on the site itself was written by its owner.\n\nFake update banners appear inside a web page while imitating browser or system design. Genuine update prompts come from the browser's own interface, not from page content. If a page tells you your browser is outdated, verify through the browser's own menu instead.\n\nMalicious browser extensions are frequently underestimated. An extension can read and modify every page you visit, including your email and your banking session. Treat a demand to install an extension in order to view content as a refusal to serve you the content.\n\nPublic Wi-Fi carries a specific risk: anyone else on the same network is positioned to observe traffic passing across it, and a network named to resemble a legitimate one may be operated by someone with exactly that intention. For casual browsing this is a minor concern. For banking, e-wallet, or account-recovery activity, use a network you trust — mobile data or your home connection — or a VPN, which encrypts your traffic so the local network cannot read it.",
      },
      {
        id: 'summary',
        title: 'Summary',
        content: "Safe browsing rests on one skill and one habit. The skill is reading the domain and knowing that it, not the page's appearance, tells you where you are. The habit is treating browser warnings as information worth reading rather than obstacles to dismiss.\n\nYou've completed the Safe Browsing lesson. Next, you'll apply it in an interactive simulation where you're searching for research sources and the browser raises a warning you have to decide how to handle.",
      },
    ],
    bestPractices: [
      'Read the domain — from https:// up to the first single slash — before entering any credentials',
      'Treat certificate warnings as a reason to leave the site, not an obstacle to click past',
      'Check reviews and reputation outside a site before entering payment details',
      'Install browser extensions only from official stores, and only ones you actively need',
      'Use mobile data, a trusted network, or a VPN for banking and e-wallet access',
      'Update your browser through its own settings menu, never through a banner on a page',
    ],
    keyTakeaways: [
      'The padlock means the connection is encrypted — it says nothing about whether the site is honest.',
      'Discounts far beyond what any real retailer could offer are the clearest sign of a scam shop.',
      'Anyone else on a public network may be able to observe your traffic, so sensitive logins need a trusted connection.',
    ],
    references: [
      { id: 'ref-01', title: 'CISA — Secure Our World, everyday online safety guidance', link: 'https://www.cisa.gov/secure-our-world' },
      { id: 'ref-02', title: 'National Cybersecurity Alliance — StaySafeOnline', link: 'https://www.staysafeonline.org/' },
    ],
  },

  scenario: safeBrowsingConfig,

  quiz: null,
}

export default safeBrowsingModuleData
