# Contracts v1

This directory is the versioned home for language-neutral AI Nexus contracts.

A contract should be added here when a current implementation has a real producer/consumer boundary that requires it. Do not create placeholder schemas solely to reserve future names.

Contracts must:

- remain language-neutral;
- avoid private Node.js or Python implementation details;
- be versioned explicitly;
- have at least one current producer or consumer, or a documented architectural reason for existing as a foundation artifact;
- be validated by the relevant automated tests or contract checks.
