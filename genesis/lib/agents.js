const groups = [
  ["Reconnaissance & Network Intelligence", [
    ["A01","Network Intelligence Analyst","Maps supplied network architecture and trust boundaries."],
    ["A02","Infrastructure Analyst","Reviews server and infrastructure descriptions."],
    ["A03","Digital Footprint Analyst","Organises authorised, public technical information."],
    ["A04","Device Security Analyst","Reviews device configuration and security posture."],
    ["A05","Protocol Researcher","Explains protocol behaviour and defensive controls."]
  ]],
  ["Vulnerability Research", [
    ["B01","Code Auditor","Reviews supplied source code for common security defects."],
    ["B02","Vulnerability Scientist","Classifies vulnerability patterns and likely impact."],
    ["B03","Dependency Analyst","Reviews software dependency and provenance risks."],
    ["B04","Configuration Auditor","Identifies insecure configuration patterns."],
    ["B05","Exploitability Researcher","Assesses exploitability conceptually in authorised lab contexts."]
  ]],
  ["Operating Systems & Devices", [
    ["C01","Windows Security Specialist","Reviews Windows hardening and identity controls."],
    ["C02","Linux Security Specialist","Reviews Linux permissions and service hardening."],
    ["C03","Mobile Security Specialist","Reviews Android and iOS application security."],
    ["C04","Firmware Specialist","Reviews firmware integrity and update practices."],
    ["C05","Hardware Security Specialist","Studies hardware trust and secure boot controls."]
  ]],
  ["Cloud & Software Infrastructure", [
    ["D01","Cloud Security Analyst","Reviews cloud architecture and IAM boundaries."],
    ["D02","API Security Analyst","Reviews API authentication, authorisation and input handling."],
    ["D03","Database Security Analyst","Reviews database access, encryption and recovery controls."],
    ["D04","Web Application Analyst","Reviews web application security design."],
    ["D05","Distributed Systems Analyst","Reviews microservice and service-to-service trust."]
  ]],
  ["Cryptography & Advanced Computing", [
    ["E01","Cryptography Scientist","Explains cryptographic design and implementation risks."],
    ["E02","Key Management Analyst","Reviews key storage, rotation and access policies."],
    ["E03","Quantum Security Researcher","Studies post-quantum migration and cryptographic resilience."],
    ["E04","Authentication Researcher","Reviews identity proofing and authentication design."],
    ["E05","Privacy Scientist","Reviews data minimisation and privacy engineering."]
  ]],
  ["Defence & Verification", [
    ["F01","Threat Intelligence Analyst","Maps supplied indicators to defensive threat knowledge."],
    ["F02","Malware Analyst","Classifies malware behaviour in safe analytical contexts."],
    ["F03","Detection Engineer","Proposes defensive detections and monitoring coverage."],
    ["F04","Incident Investigator","Builds incident timelines from supplied evidence."],
    ["F05","Independent Verifier","Challenges findings and checks evidence quality."]
  ]],
  ["GENESIS Research & Governance", [
    ["G01","Incident Historian","Maintains sourced incident lessons and timelines."],
    ["G02","Vulnerability Intelligence Analyst","Tracks vulnerability disclosures and advisories."],
    ["G03","AI Security Researcher","Studies model, agent and AI application security."],
    ["G04","Agent Behaviour Analyst","Evaluates autonomous agent behaviour and task adherence."],
    ["G05","Trust Boundary Analyst","Evaluates isolation and privilege boundaries."],
    ["G06","Supply Chain Researcher","Reviews dependency provenance and build integrity."],
    ["G07","Digital Forensic Scientist","Reconstructs events from preserved evidence."],
    ["G08","Evidence Integrity Analyst","Checks evidence provenance and tamper indicators."],
    ["G09","Security Benchmark Analyst","Designs repeatable defensive evaluations."],
    ["G10","Threat Forecast Analyst","Identifies emerging defensive research priorities."],
    ["G11","Identity Governance Analyst","Reviews least-privilege and access governance."],
    ["G12","Safety Alignment Analyst","Checks task scope and policy adherence."],
    ["G13","Privacy Engineer","Reviews privacy controls and data exposure."],
    ["G14","Incident Response Coordinator","Coordinates containment and recovery planning."],
    ["G15","Independent Safety Auditor","Audits the platform's own security controls."]
  ]]
];

export const AGENTS = groups.flatMap(([division, agents]) =>
  agents.map(([id, name, mission]) => ({
    id, name, division, mission, status: "ready",
    capabilities: ["research", "analysis", "defensive guidance"],
    execution: "No direct target access or command execution"
  }))
);

export const DIVISIONS = groups.map(([name, agents]) => ({
  name, count: agents.length, agentIds: agents.map(agent => agent[0])
}));
