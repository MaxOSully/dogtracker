import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { ClientWithDogs } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ClientInsightsProps = {
  overdueClients: ClientWithDogs[];
  suggestedFollowUps: ClientWithDogs[];
};

const ClientInsights = ({
  overdueClients,
  suggestedFollowUps,
}: ClientInsightsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Overdue Clients */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Clients Overdue for Appointment
          </h3>
          {overdueClients.length === 0 ? (
            <p className="text-center py-4 text-gray-500">
              No clients are currently overdue for an appointment.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {overdueClients.slice(0, 5).map((client) => (
                <li key={client.id} className="py-3 flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {client.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last appointment:{" "}
                      {client.lastAppointment
                        ? format(
                            parseISO(client.lastAppointment.date.toString()),
                            "MMM d, yyyy"
                          )
                        : "None"}
                    </p>
                  </div>
                  <Link href={`/appointments/add?clientId=${client.id}`}>
                    <Button variant="link" size="sm" className="text-primary">
                      Schedule
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Due Soon */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            Due for Appointment Soon
          </h3>
          {suggestedFollowUps.length === 0 ? (
            <p className="text-center py-4 text-gray-500">
              No clients are due for an appointment in the next 7 days.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {suggestedFollowUps.slice(0, 5).map((client) => (
                <li key={client.id} className="py-3 flex justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {client.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Last appointment:{" "}
                      {client.lastAppointment
                        ? format(
                            parseISO(client.lastAppointment.date.toString()),
                            "MMM d, yyyy"
                          )
                        : "None"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Frequency: Every {client.frequency} days
                    </p>
                  </div>
                  <Link href={`/appointments/add?clientId=${client.id}`}>
                    <Button variant="link" size="sm" className="text-primary">
                      Schedule
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientInsights;
