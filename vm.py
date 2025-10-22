import random
import time
import os
import matplotlib.pyplot as plt

# -------------------------------
# Configuration
# -------------------------------
RAM_CAPACITY = 500      # total RAM capacity (MB)
THRESHOLD = 0.8         # trigger swapping at 80% usage
PROCESS_COUNT = 15      # total number of simulated processes
STORAGE_FILE = "storage.txt"

# -------------------------------
# Helper Functions
# -------------------------------
def generate_process(pid):
    """Create a process with random memory requirement (in MB)."""
    return {
        "pid": pid,
        "mem_req": random.randint(50, 150),
        "state": "ready"
    }

def show_status(ram, storage):
    """Display current RAM and storage usage."""
    ram_used = sum(p["mem_req"] for p in ram)
    storage_used = sum(p["mem_req"] for p in storage)
    print(f"\nRAM Used: {ram_used}/{RAM_CAPACITY} MB | Storage Used: {storage_used} MB")
    print("RAM Processes:", [p["pid"] for p in ram])
    print("Storage Processes:", [p["pid"] for p in storage])
    return ram_used, storage_used

def write_to_storage(process):
    """Simulate moving process to internal storage (file)."""
    with open(STORAGE_FILE, "a") as f:
        f.write(str(process) + "\n")

def clear_storage_file():
    open(STORAGE_FILE, "w").close()

# -------------------------------
# Main Simulation
# -------------------------------
def simulate_virtual_ram():
    clear_storage_file()
    ram = []
    storage = []
    ram_usage = []
    storage_usage = []
    steps = []

    plt.ion()  # turn on interactive mode
    fig, ax = plt.subplots()
    ax.set_xlabel("Step (Process Arrival)")
    ax.set_ylabel("Memory Usage (MB)")
    ax.set_title("Virtual RAM Simulation - 23BIT048")

    print("---- Virtual Memory Simulation Started ----")

    for pid in range(1, PROCESS_COUNT + 1):
        process = generate_process(pid)
        ram_used = sum(p["mem_req"] for p in ram)
        step = len(steps) + 1

        if ram_used + process["mem_req"] <= RAM_CAPACITY:
            ram.append(process)
            print(f"Process {pid} (size={process['mem_req']}MB) loaded into RAM.")
        else:
            ram_used_ratio = (ram_used / RAM_CAPACITY)
            if ram_used_ratio >= THRESHOLD and len(ram) > 0:
                victim = ram.pop(0)
                victim["state"] = "swapped"
                storage.append(victim)
                write_to_storage(victim)
                print(f"RAM exceeded {THRESHOLD*100:.0f}%, swapping out Process {victim['pid']} to storage.")
            
            ram.append(process)
            print(f"Process {pid} (size={process['mem_req']}MB) loaded into RAM after swap.")

        ram_used, storage_used = show_status(ram, storage)
        steps.append(step)
        ram_usage.append(ram_used)
        storage_usage.append(storage_used)

        # Update the plot
        ax.clear()
        ax.plot(steps, ram_usage, 'bo-', label='RAM Usage')
        ax.plot(steps, storage_usage, 'ro-', label='Storage Usage')
        ax.axhline(y=RAM_CAPACITY * THRESHOLD, color='gray', linestyle='--', label='Threshold (80%)')
        ax.set_ylim(0, RAM_CAPACITY + 200)
        ax.set_xlabel("Step (Process Arrival)")
        ax.set_ylabel("Memory Usage (MB)")
        ax.set_title("Virtual RAM Simulation (RAM vs Storage Usage)")
        ax.legend()
        plt.pause(0.8)  # small delay for visualization

    print("\n---- Simulation Complete ----")
    print("Final RAM State:", [p["pid"] for p in ram])
    print("Final Storage State:", [p["pid"] for p in storage])
    plt.ioff()
    plt.show()

# -------------------------------
# Run
# -------------------------------
if __name__ == "__main__":
    simulate_virtual_ram()
