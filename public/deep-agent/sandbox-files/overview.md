# Internet of Things (IoT) Overview

A concise yet comprehensive snapshot of the IoT ecosystem, covering its definition, architecture, core components, prevalent communication protocols, and key standards.

---

## 1. Definition

- **Internet of Things (IoT)**: A network of physical objects ("things") embedded with sensors, actuators, software, and connectivity that enables them to collect, exchange, and act on data over the Internet or other networks.
- Goal: Turn everyday objects into data‑driven, interoperable resources that can be monitored and controlled remotely.

---

## 2. Architecture

Typical IoT solutions adopt a layered architecture. While implementations vary, the following four‑layer model is widely used:

1. **Perception (Device) Layer**
   - Sensors, actuators, RFID tags, and edge devices that gather raw data.
2. **Network (Connectivity) Layer**
   - Transports data between devices and higher‑level services (Wi‑Fi, Bluetooth, LPWAN, cellular, etc.).
3. **Edge/ Fog (Processing) Layer**
   - Performs local analytics, filtering, and protocol translation; reduces latency and bandwidth usage.
4. **Application (Cloud) Layer**
   - Stores data, runs advanced analytics, provides dashboards, APIs, and business logic.

> **Alternative view** – Some models split the edge layer into *Gateway* and *Cloud* layers for clearer separation of responsibilities.

---

## 3. Key Components

| Component | Role | Typical Examples |
|-----------|------|------------------|
| **Sensors / Actuators** | Capture physical phenomena or affect the environment | Temperature sensor, motion detector, smart valve |
| **Embedded Devices / Microcontrollers** | Host firmware, run lightweight OS (e.g., FreeRTOS, Zephyr) | ESP32, STM32, Raspberry Pi Zero |
| **Gateways / Edge Nodes** | Aggregate data, perform protocol conversion, run edge analytics | Intel Nuc, AWS Greengrass, Azure IoT Edge |
| **Connectivity Modules** | Provide wireless/ wired links | Wi‑Fi, BLE, Zigbee, LoRaWAN, NB‑IoT |
| **Cloud Platform** | Centralized storage, device management, analytics, AI | AWS IoT Core, Azure IoT Hub, Google Cloud IoT |
| **Application Software** | End‑user interfaces, dashboards, mobile apps | Grafana, Home Assistant, custom web portals |
| **Security Services** | Authentication, encryption, device attestation | TLS/DTLS, PKI, OAuth 2.0, Secure Boot |

---

## 4. Common Communication Protocols

| Protocol | Type | Typical Use‑Case | Key Characteristics |
|----------|------|-----------------|----------------------|
| **MQTT** | Publish/Subscribe (TCP) | Low‑power sensor data, telemetry | Small header, QoS levels, retained messages |
| **CoAP** | Request/Response (UDP) | Constrained devices, low‑latency control | REST‑like, built‑in observe, DTLS security |
| **HTTP/HTTPS** | Request/Response (TCP) | Web‑based dashboards, firmware updates | Widely supported, heavier overhead |
| **AMQP** | Message Queue (TCP) | Enterprise‑grade messaging, reliability | Rich features, higher footprint |
| **LwM2M** | Device Management (CoAP) | Remote provisioning, firmware upgrade | Uses CoAP, object‑oriented resource model |
| **WebSockets** | Full‑duplex (TCP) | Real‑time UI updates | Persistent connection, works over HTTP ports |

---

## 5. Standards & Specifications

| Standard | Organization | Scope | Relevance to IoT |
|----------|--------------|-------|-------------------|
| **IEEE 802.15.4** | IEEE | Low‑rate WPAN physical & MAC layers | Foundation for Zigbee, Thread, 6LoWPAN |
| **Zigbee** | Zigbee Alliance | Mesh networking, security, device profiles | Widely used in home automation |
| **Thread** | Thread Group | IPv6‑based mesh network for smart home | Built on 802.15.4, supports secure commissioning |
| **6LoWPAN** | IETF | IPv6 adaptation over low‑power radios | Enables IP routing on constrained devices |
| **OCF (Open Connectivity Foundation)** | OCF | Interoperability framework, device discovery, data models | Defines common resource schema, security stack |
| **Bluetooth LE (BLE) 5.x** | Bluetooth SIG | Short‑range, low‑energy communication | GATT profiles for health, proximity, beacons |
| **LoRaWAN** | LoRa Alliance | Wide‑area, low‑power, star topology | Ideal for remote sensing, long‑range coverage |
| **NB‑IoT / LTE‑M** | 3GPP | Cellular IoT, narrowband, low‑power | Provides carrier‑grade coverage and mobility |
| **ISO/IEC 30141** | ISO/IEC | Reference Architecture for IoT | High‑level taxonomy, functional blocks |
| **OneM2M** | OneM2M | Global M2M service layer standard | Defines common service primitives across domains |

---

## 6. Quick Reference Checklist

- **Define the problem** – What data or control is needed?
- **Select devices** – Sensors/actuators + microcontroller.
- **Choose connectivity** – Wi‑Fi, BLE, Zigbee, LoRaWAN, etc.
- **Pick a protocol** – MQTT for telemetry, CoAP for constrained interactions.
- **Plan security** – TLS/DTLS, device authentication, firmware signing.
- **Deploy edge or cloud** – Edge for latency‑critical tasks, cloud for storage/analytics.
- **Implement standards** – Leverage IEEE 802.15.4, OCF, or others for interoperability.

---

## 7. Further Reading

- *“Internet of Things: Principles and Paradigms”* – Rajkumar Buyya et al.
- IEEE 802.15.4 Standard – https://standards.ieee.org/standard/802_15_4-2020.html
- OCF Specification – https://openconnectivity.org/specifications
- MQTT v5.0 Specification – https://mqtt.org/mqtt-specification/
- CoAP RFC 7252 – https://datatracker.ietf.org/doc/html/rfc7252

---

*Prepared as a concise research summary for quick onboarding and reference.*